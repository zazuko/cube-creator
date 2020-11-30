import { RequestHandler } from 'express'
import clownface from 'clownface'
import asyncMiddleware from 'middleware-async'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'

export const expectsDisambiguate: RequestHandler = asyncMiddleware(async (req, res, next) => {
  if (req.hydra.operations.length <= 1) {
    return next()
  }

  const api = clownface(req.hydra.api)
  const resource = await req.resource()
  const resourceTypes = new TermSet(api.node(resource.out(rdf.type)).terms)

  req.hydra.operations = req.hydra.operations.filter(({ operation }) => {
    const expectedClasses = api.node(operation.out(hydra.expects).terms)
      .has(rdf.type, hydra.Class)
      .terms

    return new Set(expectedClasses.filter(type => !resourceTypes.has(type))).size === 0
  })
  next()
})
