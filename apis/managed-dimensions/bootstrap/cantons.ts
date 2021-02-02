import { schema } from '@tpluscode/rdf-ns-builders'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { Quad } from 'rdf-js'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { dimension, lindasSchema } from '../lib/namespace'
import env from '../lib/env'

export default function (client: ParsingClient): Promise<Quad[]> {
  return CONSTRUCT`
      ${dimension.canton} a ${schema.DefinedTermSet} .
      ${dimension.canton} ${schema.validFrom} ?now .
      ${dimension.canton} ${schema.name} "Cantons"@en , "Kantone"@de , "Cantons"@fr , "Cantoni"@it .
      ?canton a ${schema.DefinedTerm} .
      ?canton ${schema.inDefinedTermSet} ${dimension.canton} .
      ?canton ${schema.validFrom} ?now .
      ?canton ${schema.identifier} ?name .
  `.WHERE`
    BIND(NOW() as ?now)

    SERVICE <${env.MANAGED_DIMENSIONS_SOURCE}> {
        ?canton a ${lindasSchema.Canton} ;
                ${schema.alternateName} ?name
    }`.execute(client.query)
}
