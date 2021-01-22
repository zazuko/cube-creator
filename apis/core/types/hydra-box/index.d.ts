declare module 'hydra-box' {
  import { Request, RequestHandler, Router } from 'express'
  import Api = require('hydra-box/Api');
  import { DatasetCore, Term, NamedNode, Stream } from 'rdf-js'
  import type { GraphPointer } from 'clownface'
  import { Readable } from 'stream'
  import DatasetExt from 'rdf-ext/lib/Dataset'

  namespace hydraBox {
    interface ObjectResource {
      term: NamedNode
      prefetchDataset: DatasetCore
      dataset(): Promise<DatasetCore>
      quadStream(): Stream & Readable
      types: Set<Term>
    }

    interface PropertyResource extends ObjectResource {
      property: Term
      object: Term
    }

    interface ResourceLoader {
      forClassOperation (term: Term, req: Request): Promise<Array<ObjectResource>>
      forPropertyOperation (term: Term, req: Request): Promise<Array<PropertyResource>>
    }

    interface PotentialOperation {
      resource: ObjectResource | PropertyResource
      operation: GraphPointer
    }

    interface HydraBox {
      api: Api
      term: NamedNode
      resource: ObjectResource & { clownface(): Promise<GraphPointer<NamedNode, DatasetExt>> }
      operation: GraphPointer
      operations: PotentialOperation[]
    }

    interface Options {
      baseIriFromRequest?: boolean
      loader?: hydraBox.ResourceLoader
      store?: any
      middleware?: {
        resource?: RequestHandler | RequestHandler[]
        operations?: RequestHandler | RequestHandler[]
      }
    }
  }

  function middleware(api: Api, options: hydraBox.Options): Router

  const hydraBox: {
    Api: Api
    middleware: typeof middleware
  }

  export = hydraBox
}
