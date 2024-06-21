import $rdf from '@zazuko/env'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import StreamClient from 'sparql-http-client/StreamClient.js'
import { TurtleTemplateResult } from '@tpluscode/rdf-string'

const parser = new Parser()

interface Bootstrap {
  base: string
  storeUrl: string
  user?: string
  password?: string
  resources: TurtleTemplateResult[]
  postRequest?: boolean
}

export async function bootstrap({ base, storeUrl, user, password, resources, postRequest = false }: Bootstrap) {
  const client = new StreamClient({
    storeUrl,
    user,
    password,
  })

  const dataset = await resources.reduce((previous, turtle) => {
    return previous.then(next => {
      return next.import(parser.import(toStream(turtle.toString({ base }))))
    })
  }, Promise.resolve($rdf.dataset()))

  if (postRequest) {
    await client.store.post(dataset.toStream())
  } else {
    await client.store.put(dataset.toStream())
  }
}
