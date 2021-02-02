import * as core from '@cube-creator/core/bootstrap'
import { schema } from '@tpluscode/rdf-ns-builders'
import { turtle, TurtleTemplateResult } from '@tpluscode/rdf-string'
import { ASK } from '@tpluscode/sparql-builder'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { NamedNode } from 'rdf-js'
import env, { graph } from '../lib/env'
import { log } from '../lib/log'
import termSetCollections from './termSetCollections'
import { sparql } from '../lib/sparql'
import cantons from './cantons'
import { dimension } from '../lib/namespace'
import entrypoint from './entrypoint'

const client = new ParsingClient(sparql)

const resources = [
  termSetCollections,
  entrypoint,
]

function wrapInNamedGraph(data: TurtleTemplateResult) {
  return turtle`GRAPH ${graph} { ${data} }`
}

function hasManagedDimension(termSet: NamedNode) {
  return ASK`${termSet} a ${schema.DefinedTermSet}`.FROM(graph).execute(client.query)
}

export default async function (): Promise<void> {
  log('Bootstrapping API resources')

  if (!await hasManagedDimension(dimension.canton)) {
    log('Initialise Managed Dimension "Cantons"')
    const cantonsQuads = await cantons(client)
    resources.push(turtle`${cantonsQuads}`)
  }

  await core.bootstrap({
    storeUrl: env.MANAGED_DIMENSIONS_STORE_GRAPH_ENDPOINT,
    base: env.MANAGED_DIMENSIONS_BASE,
    user: env.maybe.MANAGED_DIMENSIONS_STORE_USERNAME,
    password: env.maybe.MANAGED_DIMENSIONS_STORE_PASSWORD,
    resources: resources.map(wrapInNamedGraph),
    postRequest: true,
  })
}
