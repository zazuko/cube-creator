import * as core from '@cube-creator/core/bootstrap'
import env from '@cube-creator/core/env'
import { log } from '../lib/log.js'
import { cubeProjects } from './cube-projects.js'
import { entrypoint } from './entrypoint.js'
import { organizations } from './organizations.js'
import shapes from './shapes/index.js'
import { users } from './users.js'

const resources = [cubeProjects, entrypoint, organizations, ...shapes, users]

export async function bootstrap(storeUrl: string, base: string) {
  log('Bootstrapping API resources')
  await core.bootstrap({
    storeUrl,
    base,
    user: env.maybe.STORE_ENDPOINTS_USERNAME,
    password: env.maybe.STORE_ENDPOINTS_PASSWORD,
    resources,
  })
}
