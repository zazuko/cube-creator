import asyncMiddleware from 'middleware-async'
import $rdf from 'rdf-ext'
import { Term, Quad, NamedNode } from 'rdf-js'
import { hydra, rdf, sh } from '@tpluscode/rdf-ns-builders'
import SHACLValidator from 'rdf-validate-shacl'
import clownface, { GraphPointer } from 'clownface'
import { resourceStore } from '../domain/resources'
import { ProblemDocument } from 'http-problem-details'
import { loadResourcesTypes } from '../domain/queries/resources-types'

interface ShaclMiddlewareOptions {
  createResourceStore: typeof resourceStore
  loadResourcesTypes(ids: Term[]): Promise<Quad[]>
}

export const shaclMiddleware = (options: ShaclMiddlewareOptions) => asyncMiddleware(async (req, res, next) => {
  const resources = options.createResourceStore()

  let resource: GraphPointer<NamedNode>
  if (!req.dataset) {
    resource = clownface({ dataset: $rdf.dataset() }).node(req.hydra.term)
  } else {
    resource = await req.resource()
  }

  const shapes = $rdf.dataset()
  await Promise.all(req.hydra.operation.out(hydra.expects).map(async (expects) => {
    if (expects.term.termType !== 'NamedNode') return

    const pointer = await resources.get(expects.term)
    if (pointer?.has(rdf.type, [sh.NodeShape]).values.length) {
      await shapes.addAll([...pointer.dataset])

      if (pointer.out([sh.targetClass, sh.targetNode, sh.targetObjectsOf, sh.targetSubjectsOf]).values.length === 0) {
        shapes.add($rdf.quad(pointer.term, sh.targetNode, resource.term))
      }

      resource.addOut(rdf.type, pointer.out(sh.targetClass))
    }
  }))

  if (shapes.size === 0) {
    return next()
  }

  // Load data from linked instances to be able to validate their type
  const classProperties = clownface({ dataset: shapes })
    .out(sh.property)
    .has(sh.class)
    .out(sh.path)
  const linkedInstancesIds = resource.out(classProperties).terms.filter(r => r.termType !== 'BlankNode')
  const linkedInstancesQuads = await options.loadResourcesTypes(linkedInstancesIds)

  const dataset = $rdf.dataset([...resource.dataset, ...linkedInstancesQuads])

  const validationReport = new SHACLValidator(shapes).validate(dataset)
  if (validationReport.conforms) {
    return next()
  }

  const responseReport = validationReport.results.map((r) => ({
    message: r.message.map((message) => message.value),
    path: r.path?.value,
  }))
  const response = new ProblemDocument({
    status: 400,
    title: 'Request validation error',
    detail: 'The request payload does not conform to the SHACL description of this endpoint.',
    type: 'http://tempuri.org/BadRequest',
  }, {
    report: responseReport,
  })

  res.status(400).send(response)
})

export const shaclValidate = shaclMiddleware({
  createResourceStore: resourceStore,
  loadResourcesTypes,
})
