import express from 'express'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import ResourceStoreImpl, { ResourceStore } from '../ResourceStore'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

declare module 'express-serve-static-core' {
  export interface Application {
    resources(): ResourceStore
  }

  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }
}

export function resource(req: express.Request, res: unknown, next: express.NextFunction) {
  if (!req.app.resources) {
    req.app.resources = () => new ResourceStoreImpl(req.app.sparql)
  }

  req.resource = async () => {
    const dataset = await req.dataset()

    const expectedTypes = req.hydra.operation
      .out(hydra.expects)
      .has(rdf.type, hydra.Class)

    return clownface({ dataset })
      .namedNode('')
      .addOut(rdf.type, expectedTypes)
  }

  next()
}
