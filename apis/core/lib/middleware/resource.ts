import express from 'express'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

declare module 'express-serve-static-core' {
  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }
}

export function resource(req: express.Request, res: unknown, next: express.NextFunction) {
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
