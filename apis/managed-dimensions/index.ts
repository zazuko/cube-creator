import { hydraBox } from '@hydrofoil/labyrinth'
import type { Router } from 'express'
import path from 'path'
import $rdf from 'rdf-ext'
import ParsingClient from 'sparql-http-client/ParsingClient'
import StreamClient from 'sparql-http-client/StreamClient'
import env from './lib/env'
import bootstrap from './bootstrap'
import Loader from './lib/loader'
import { sparql } from './lib/sparql'

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.MANAGED_DIMENSIONS_BASE

export async function managedDimensions(): Promise<Router> {
  await bootstrap()

  return hydraBox({
    apiPath,
    codePath,
    baseUri,
    loader: new Loader({
      graph: $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH),
      sparql: new ParsingClient(sparql),
      stream: new StreamClient(sparql),
    }),
    sparql,
  })
}
