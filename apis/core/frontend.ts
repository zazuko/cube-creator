import fs from 'fs'
import { Request, Response } from 'express'
import env from './lib/env'

export function uiConfig(req: Request, res: Response): void {
  res.header('content-type', 'application/javascript')

  if (env.has('AUTH_CONFIG_FILE')) {
    const stream = fs.createReadStream(env.AUTH_CONFIG_FILE)
    stream.pipe(res)
  } else {
    res.write(`
window.oidc = {
  authority: '${env.AUTH_ISSUER}',
  clientId: '${env.AUTH_CLIENT_ID}',
  scope: 'openid email profile pipelines:read pipelines:write',
}`)
  }
  res.end()
}
