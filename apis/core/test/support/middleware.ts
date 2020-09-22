import { HydraBox } from 'hydra-box'
import express from 'express'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import clownface from 'clownface'
import rdfHandler from '@rdfjs/express-handler'
import { TestResourceStore } from './TestResourceStore'

export function appMock(prepare?: (hydra: HydraBox) => void): express.RequestHandler {
  return async function (req, res, next) {
    await rdfHandler.attach(req, res)

    const hydra: Partial<HydraBox> = {
      operation: cf({ dataset: $rdf.dataset() }).blankNode(),
    }

    if (prepare) {
      prepare(hydra as any)
    }

    req.hydra = hydra as any
    next()
  }
}

export function mockResourceMiddleware(resources: GraphPointer<NamedNode>[] = []): express.RequestHandler {
  return (req, res, next) => {
    req.app.resources = () => new TestResourceStore(resources)

    req.resource = async () => clownface({ dataset: await req.dataset() }).namedNode('')

    next()
  }
}
