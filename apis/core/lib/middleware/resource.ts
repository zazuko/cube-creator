import express from 'express'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

declare module 'express-serve-static-core' {
  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }
}

export function resource(req: express.Request, res: unknown, next: express.NextFunction) {
  req.resource = async () => {
    if (!req.dataset) {
      return clownface({ dataset: $rdf.dataset() }).node(req.hydra.term)
    }

    const dataset = await req.dataset()

    const resource = clownface({ dataset }).node(req.hydra.term)
    if (resource.out().values.length) {
      return resource
    }

    const pointer = clownface({ dataset }).namedNode('')

    if (req.hydra.operation) {
      const expectedTypes = req.hydra.operation
        .out(hydra.expects)
        .has(rdf.type, hydra.Class)

      pointer.addOut(rdf.type, expectedTypes)
    }

    return pointer
  }

  next()
}
