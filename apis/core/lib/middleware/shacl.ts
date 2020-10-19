import asyncMiddleware from 'middleware-async'
import $rdf from 'rdf-ext'
import { hydra, rdf, sh } from '@tpluscode/rdf-ns-builders'
import SHACLValidator from 'rdf-validate-shacl'
import error from 'http-errors'
import { resourceStore } from '../domain/resources'

export const shaclMiddleware = (createResourceStore: typeof resourceStore) => asyncMiddleware(async (req, res, next) => {
  const resources = createResourceStore()

  const shapes = $rdf.dataset()
  await Promise.all(req.hydra.operation.out(hydra.expects).map(async (expects) => {
    if (expects.term.termType !== 'NamedNode') return

    const pointer = await resources.get(expects.term)
    if (pointer.has(rdf.type, [sh.NodeShape]).values.length) {
      await shapes.addAll([...pointer.dataset])
    }
  }))

  if (shapes.size === 0) {
    return next()
  }

  if (!req.dataset) {
    return next(new error.BadRequest())
  }

  const resource = await req.resource()
  if (resource.dataset.size === 0) {
    return next(new error.BadRequest('Resource cannot be empty'))
  }

  const validationResult = new SHACLValidator(shapes).validate(resource.dataset)
  if (validationResult.conforms) {
    return next()
  }

  return next(new error.BadRequest())
})

export const shaclValidate = shaclMiddleware(resourceStore)
