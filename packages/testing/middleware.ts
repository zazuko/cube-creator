import type { NamedNode } from '@rdfjs/types'
import { HydraBox } from '@kopflos-cms/core'
import express from 'express'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import rdfHandler from '@rdfjs/express-handler'
import { ex } from './lib/namespace.js'

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
      operation: $rdf.clownface({ dataset: $rdf.dataset() }).blankNode(),
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

      return $rdf.clownface({ dataset: await req.dataset() }).namedNode('')
    }

    next()
  }
}
