import { Term, Quad } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { streamClient } from '../../query-client'

export async function loadResourcesTypes(ids: Term[], client = streamClient): Promise<Quad[]> {
  const stream = await CONSTRUCT`?resource ${rdf.type} ?type`
    .WHERE`
      values ?resource {
        ${ids}
      }
    `
    .WHERE`GRAPH ?g {
        ?resource a ?type .
    }`.execute(client.query)

  return new Promise((resolve, reject) => {
    const quads: Quad[] = []

    stream.on('data', (quad) => {
      quads.push(quad)
    })

    stream.on('end', () => {
      resolve(quads)
    })

    stream.on('error', err => {
      reject(err)
    })
  })
}
