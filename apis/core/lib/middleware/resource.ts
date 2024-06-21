import express from 'express'
import once from 'once'
import ResourceStoreImpl, { ResourceStore, SparqlStoreFacade } from '../ResourceStore.js'
import { streamClient } from '../query-client.js'

declare module 'express-serve-static-core' {
  export interface Request {
    resourceStore(): ResourceStore
  }
}

export function resourceStore(req: express.Request, res: unknown, next: express.NextFunction) {
  req.resourceStore = once(() => {
    return new ResourceStoreImpl(new SparqlStoreFacade(streamClient, () => req.user?.id))
  })

  next()
}
