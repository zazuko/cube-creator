import * as core from '@cube-creator/core/bootstrap'
import env from '@cube-creator/core/env'
import { log } from '../lib/log'
import { cubeProjects } from './cube-projects'
import { entrypoint } from './entrypoint'
import { organizations } from './organizations'
import shapes from './shapes'
import { users } from './users'

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
