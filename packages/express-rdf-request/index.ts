import type { NamedNode, Quad } from '@rdfjs/types'
import express from 'express'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

declare module 'express-serve-static-core' {
  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }
}

declare module '@rdfjs/types' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Stream extends AsyncIterable<Quad> {}
}

const emptyNamedNode = $rdf.namedNode('')

export function resource(req: express.Request, res: unknown, next: express.NextFunction) {
  req.resource = async () => {
    const dataset = $rdf.dataset()

    if (!req.dataset) {
      return clownface({ dataset }).node(req.hydra.term)
    }

    for (const quad of await req.dataset()) {
      const { predicate, graph } = quad
      const subject = quad.subject.equals(emptyNamedNode) ? req.hydra.term : quad.subject
      const object = quad.object.equals(emptyNamedNode) ? req.hydra.term : quad.object

      dataset.add($rdf.quad(subject, predicate, object, graph))
    }

    const pointer = clownface({ dataset }).namedNode(req.hydra.term)

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
