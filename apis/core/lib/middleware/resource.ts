import express from 'express'
import once from 'once'
import ResourceStoreImpl from '../ResourceStore'
import { streamClient } from '../query-client'

declare module 'express-serve-static-core' {
  export interface Request {
    resourceStore(): ResourceStoreImpl
  }
}

export function resourceStore(req: express.Request, res: unknown, next: express.NextFunction) {
  req.resourceStore = once(() => {
    return new ResourceStoreImpl(streamClient)
  })

  next()
}
