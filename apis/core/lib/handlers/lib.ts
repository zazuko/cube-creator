import type { Request } from 'express'

export function isMultipart(req: Request) {
  return req.get('content-type')?.includes('multipart/form-data')
}
