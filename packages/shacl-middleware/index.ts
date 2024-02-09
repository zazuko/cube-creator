import type { Term, Quad, NamedNode, DatasetCore } from '@rdfjs/types'
import { Request, Response } from 'express'
import asyncMiddleware from 'middleware-async'
import $rdf from 'rdf-ext'
import { hydra, rdf, sh } from '@tpluscode/rdf-ns-builders'
import SHACLValidator from 'rdf-validate-shacl'
import clownface, { GraphPointer } from 'clownface'
import { ProblemDocument } from 'http-problem-details'
import ValidationReport from 'rdf-validate-shacl/src/validation-report'

interface ShaclMiddlewareOptions {
  loadShapes?(req: Request): Promise<DatasetCore>
  loadResource(id: NamedNode, req: Request): Promise<GraphPointer<NamedNode> | null>
  loadResourcesTypes(ids: Term[]): Promise<Quad[]>
  getTargetNode?(req: Request, res: Response): NamedNode | undefined
  parseResource?(req: Request, res: Response): Promise<GraphPointer<NamedNode>>

  /**
   * Will deactivate all SHACL Properties with sh:class. This is useful when validation of external
   * resources may not be possible in a given context
   */
  disableShClass?: boolean
}

async function defaultParse(req: Request) {
  if (!req.dataset) {
    return clownface({ dataset: $rdf.dataset() }).node(req.hydra.term)
  }

  return req.resource()
}

interface ValidationResponseOptions {
  title?: string
  detail?: string
  type?: string
}

export function validationReportResponse(res: Response, validationReport: ValidationReport, {
  title = 'Request validation error',
  detail = 'The request payload does not conform to the SHACL description of this endpoint.',
  type = 'http://tempuri.org/BadRequest',
}: ValidationResponseOptions = {}): void {
  const serializeResult = (result: any) => ({
    message: result.message.map((message: Term) => message.value),
    path: result.path?.value,
    detail: result.detail.map(serializeResult),
  })
  const responseReport = validationReport.results.map(serializeResult)
  const response = new ProblemDocument({
    status: 400,
    title,
    detail,
    type,
  }, {
    report: responseReport,
  })

  res.status(400).send(response)
}

function defaultShapes(loadResource: ShaclMiddlewareOptions['loadResource'], targetNode: NamedNode, resource: GraphPointer) {
  return async (req: Request): Promise<DatasetCore> => {
    const shapes = $rdf.dataset()
    await Promise.all(req.hydra.operation.out(hydra.expects).map(async (expects) => {
      if (expects.term.termType !== 'NamedNode') return

      const pointer = await loadResource(expects.term, req)
      if (pointer?.has(rdf.type, [sh.NodeShape]).values.length) {
        await shapes.addAll([...pointer.dataset])

        if (pointer.out([sh.targetClass, sh.targetNode, sh.targetObjectsOf, sh.targetSubjectsOf]).values.length === 0) {
          shapes.add($rdf.quad(pointer.term, sh.targetNode, targetNode))
        }

        resource.addOut(rdf.type, pointer.out(sh.targetClass))
      }
    }))

    return shapes
  }
}

export const shaclMiddleware = ({ getTargetNode, loadResource, loadShapes, loadResourcesTypes, parseResource = defaultParse, disableShClass }: ShaclMiddlewareOptions) => asyncMiddleware(async (req, res, next) => {
  let resource = await parseResource(req, res)
  const targetNode = getTargetNode?.(req, res) || resource.term
  resource = resource.node(targetNode)

  const shapes = await (loadShapes || defaultShapes(loadResource, targetNode, resource))(req)

  if (shapes.size === 0) {
    return next()
  }

  if (resource.dataset.match(targetNode).size === 0 && shapes.match(null, sh.property).size > 0) {
    const response = new ProblemDocument({
      status: 400,
      title: 'Request validation error',
      detail: 'Missing target node in request body',
    })
    return res.status(400).send(response)
  }

  let dataset: DatasetCore
  if (disableShClass) {
    clownface({ dataset: shapes }).has(sh.class).addOut(sh.deactivated, true)

    dataset = resource.dataset
  } else {
    // Load data from linked instances to be able to validate their type
    const classProperties = clownface({ dataset: shapes })
      .out(sh.property)
      .has(sh.class)
      .out(sh.path)
    const linkedInstancesIds = resource.out(classProperties).terms.filter(r => r.termType !== 'BlankNode')
    const linkedInstancesQuads = await loadResourcesTypes(linkedInstancesIds)
    dataset = $rdf.dataset([...resource.dataset, ...linkedInstancesQuads])
  }

  const validationReport = new SHACLValidator(shapes).validate(dataset)
  if (validationReport.conforms) {
    return next()
  }

  validationReportResponse(res, validationReport)
})
