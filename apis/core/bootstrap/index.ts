import $rdf from 'rdf-ext'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import StreamClient from 'sparql-http-client/StreamClient'
import { cubeProjects } from './cube-projects'
import { log } from '../lib/log'
import { entrypoint } from './entrypoint'
import { organizations } from './organizations'
import shapes from './shapes'
import env from '@cube-creator/core/env'

const parser = new Parser()
const initialResources = [cubeProjects, entrypoint, organizations, ...shapes]

export async function bootstrap(storeUrl: string, base: string) {
  const client = new StreamClient({
    storeUrl,
    user: env.maybe.STORE_ENDPOINTS_USERNAME,
    password: env.maybe.STORE_ENDPOINTS_PASSWORD,
  })

  const dataset = await initialResources.reduce((previous, turtle) => {
    return previous.then(next => {
      return next.import(parser.import(toStream(turtle.toString({ base }))))
    })
  }, Promise.resolve($rdf.dataset()))

  log('Bootstrapping API resources')
  await client.store.put(dataset.toStream())
}
