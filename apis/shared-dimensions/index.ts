import { hydraBox } from '@hydrofoil/labyrinth'
import { Router } from 'express'
import path from 'path'
import $rdf from 'rdf-ext'
import camouflage from 'camouflage-rewrite'
import env from './lib/env'
import bootstrap from './bootstrap'
import Loader from './lib/loader'
import { sparql, parsingClient, streamClient } from './lib/sparql'

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.MANAGED_DIMENSIONS_BASE

export async function sharedDimensions(): Promise<Router> {
  await bootstrap()

  return Router()
    .use(camouflage({
      url: baseUri,
      rewriteContent: true,
      rewriteHeaders: true,
    }))
    .use(await hydraBox({
      apiPath,
      codePath,
      baseUri,
      loader: new Loader({
        graph: $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH),
        sparql: parsingClient,
        stream: streamClient,
      }),
      sparql,
    }))
}
