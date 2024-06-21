import path from 'path'
import { hydraBox } from '@hydrofoil/labyrinth'
import { Router } from 'express'
import $rdf from '@cube-creator/env'
import camouflage from 'camouflage-rewrite'
import { Environment } from '@zazuko/env-node'
import Fs from '@zazuko/rdf-utils-fs/Factory.js'
import formats from '@rdfjs/formats'
import env from './lib/env.js'
import bootstrap from './bootstrap/index.js'
import Loader from './lib/loader.js'
import { sparql, parsingClient, streamClient } from './lib/sparql.js'
import { patchResponseStream } from './lib/middleware/canonicalRewrite.js'

$rdf.formats.import(formats)

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.MANAGED_DIMENSIONS_BASE

export async function sharedDimensions(): Promise<Router> {
  await bootstrap()

  return Router()
    .use(camouflage({
      url: baseUri,
      rewriteHeaders: true,
    }))
    .use(await hydraBox({
      env: new Environment([Fs], { parent: $rdf }),
      term: $rdf.namedNode(`${env.MANAGED_DIMENSIONS_API_BASE}dimension/api`),
      apiPath,
      codePath,
      baseUri: env.MANAGED_DIMENSIONS_API_BASE,
      loader: new Loader({
        graph: $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH),
        sparql: parsingClient,
        stream: streamClient,
      }),
      sparql,
      middleware: {
        resource: patchResponseStream,
      },
    }))
}
