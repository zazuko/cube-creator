import type { NamedNode } from '@rdfjs/types'
import { HydraBox } from 'hydra-box'
import express from 'express'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import rdfHandler from '@rdfjs/express-handler'
import { ex } from './lib/namespace'

declare module 'express-serve-static-core' {
  export interface Request {
    resource(): Promise<GraphPointer<NamedNode>>
  }
}

type RecursivePartial<T> = {
  [P in keyof T]?: Partial<T[P]>
}

export function appMock(prepare?: (hydra: HydraBox) => void): express.RequestHandler {
  return async function (req, res, next) {
    await rdfHandler.attach(req, res)

    const hydra: RecursivePartial<HydraBox> = {
      operation: cf({ dataset: $rdf.dataset() }).blankNode(),
      api: {
        dataset: $rdf.dataset(),
        graph: $rdf.namedNode('foo'),
        term: ex.Api,
      },
    }

    if (prepare) {
      prepare(hydra as any)
    }

    req.hydra = hydra as any
    next()
  }
}

export function mockResourceMiddleware(): express.RequestHandler {
  return (req, res, next) => {
    req.resource = async () => {
      if (!req.dataset) throw new Error('Missing request `.dataset`')

      return cf({ dataset: await req.dataset() }).namedNode('')
    }

    next()
  }
}
