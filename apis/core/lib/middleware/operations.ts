import { RequestHandler } from 'express'
import clownface, { GraphPointer } from 'clownface'
import asyncMiddleware from 'middleware-async'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import { log } from '../log'

function logRemovedOperation(operation: GraphPointer) {
  const method = operation.out(hydra.method).value
  const types = operation.out(rdf.type).values
  const clas = operation.in(hydra.supportedOperation).values
  log('Removing %s operation %o supported by %o', method, types, clas)
}

export const expectsDisambiguate: RequestHandler = asyncMiddleware(async (req, res, next) => {
  if (req.hydra.operations.length < 2) {
    return next()
  }

  const api = clownface(req.hydra.api)
  const resource = await req.resource()
  const resourceTypes = new TermSet(api.node(resource.out(rdf.type)).terms)

  req.hydra.operations = req.hydra.operations.filter(({ operation }) => {
    const expectedClasses = api.node(operation.out(hydra.expects).terms)
      .has(rdf.type, hydra.Class)
      .terms

    const shouldRemove = new Set(expectedClasses.filter(type => !resourceTypes.has(type))).size !== 0
    if (shouldRemove && log.enabled) {
      logRemovedOperation(operation)
    }
    return !shouldRemove
  })
  next()
})

export const preferHydraCollection: RequestHandler = (req, res, next) => {
  if (req.hydra.operations.length < 2) {
    return next()
  }

  const collectionOperations = req.hydra.operations
    .filter(({ operation }) => new TermSet(operation.in(hydra.supportedOperation).terms).has(hydra.Collection))
  const resourceOperations = req.hydra.operations
    .filter(({ operation }) => new TermSet(operation.in(hydra.supportedOperation).terms).has(hydra.Resource))

  if (collectionOperations) {
    req.hydra.operations = req.hydra.operations.filter(value => {
      const shouldRemove = resourceOperations.includes(value)
      if (shouldRemove && log.enabled) {
        logRemovedOperation(value.operation)
      }
      return !shouldRemove
    })
  }

  next()
}
