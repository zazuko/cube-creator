import * as core from '@cube-creator/core/bootstrap'
import { turtle, TurtleTemplateResult } from '@tpluscode/rdf-string'
import env, { graph } from '../lib/env'
import { log } from '../lib/log'
import termSetCollections from './termSetCollections'
import entrypoint from './entrypoint'

const resources = [
  termSetCollections,
  entrypoint,
]

function wrapInNamedGraph(data: TurtleTemplateResult) {
  return turtle`GRAPH ${graph} { ${data} }`
}

export default async function (): Promise<void> {
  log('Bootstrapping API resources')

  await core.bootstrap({
    storeUrl: env.MANAGED_DIMENSIONS_STORE_GRAPH_ENDPOINT,
    base: env.MANAGED_DIMENSIONS_BASE,
    user: env.maybe.MANAGED_DIMENSIONS_STORE_USERNAME,
    password: env.maybe.MANAGED_DIMENSIONS_STORE_PASSWORD,
    resources: resources.map(wrapInNamedGraph),
    postRequest: true,
  })
}
