import { Literal, NamedNode, Term } from 'rdf-js'
import { INSERT, SELECT } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import TermSet from '@rdfjs/term-set'
import { prov } from '@tpluscode/rdf-ns-builders/strict'
import env from '@cube-creator/core/env'
import { Dictionary } from '@rdfine/prov'
import { parsingClient } from '../../query-client'

async function findCubeGraph(dimensionMapping: Term, client: typeof parsingClient): Promise<NamedNode> {
  const patternsToFindCubeGraph = sparql`BIND ( ${dimensionMapping} as ?dimensionMapping )

  graph ?dimensionMapping {
      ?dimensionMapping ${schema.about} ?dimension .
    }

    graph ?metadata {
      ?metadata a ${cc.DimensionMetadataCollection} ; ${schema.hasPart} ?dimensionMetadata .
      ?dimensionMetadata ${cc.dimensionMapping} ?dimensionMapping ;
                         ${schema.about} ?dimension .
    }

    graph ?dataset {
     ?dataset ${cc.dimensionMetadata} ?metadata .
    }

    graph ?project {
      ?project a ${cc.CubeProject} ;
               ${cc.dataset} ?dataset ;
               ${cc.cubeGraph} ?cubeGraph .
    }`

  const [{ cubeGraph }] = await SELECT`?cubeGraph`
    .WHERE`${patternsToFindCubeGraph}`
    .execute(client.query)

  return cubeGraph as any
}

function unmappedValuesQuery(cubeGraph: NamedNode, dimensionMapping: Term) {
  return SELECT.DISTINCT`?value`
    .WHERE`
      # find mapped dimension URL
      GRAPH ${dimensionMapping} {
        ${dimensionMapping} ${schema.about} ?dimension
      }

      # find all values from observation and shape
      GRAPH ${cubeGraph} {
        {
          ?shape a ${cube.Constraint} ; ${sh.property} ?propShape .
          ?propShape ${sh.path} ?dimension ;
                     ${sh.in}/${rdf.rest}* ?listNode .
          ?listNode ${rdf.first} ?value .
        }
        UNION
        {
          ?observation a ${cube.Observation} ; ?dimension ?value .
        }

        filter ( !isIRI(?value) )
      }

    # exclude values which are already mapped
    FILTER ( NOT EXISTS {
      GRAPH ${dimensionMapping} {
        ${dimensionMapping} ${prov.hadDictionaryMember} [
           ${prov.pairKey} ?value ; ${prov.pairEntity} []
        ]
      }
    })
    `
}

export async function getUnmappedValues(dimensionMapping: Term, client = parsingClient): Promise<Set<Literal>> {
  const cubeGraph = await findCubeGraph(dimensionMapping, client)

  const unmappedValues = await unmappedValuesQuery(cubeGraph, dimensionMapping)
    .execute(client.query)

  return new TermSet(unmappedValues.map(result => result.value as any))
}

export async function importMappingsFromSharedDimension(dimensionMapping: Dictionary, client = parsingClient) {
  const cubeGraph = await findCubeGraph(dimensionMapping.id, client)

  const unmappedValuesSelect = unmappedValuesQuery(cubeGraph, dimensionMapping.id)

  const insert = INSERT`
    GRAPH ${dimensionMapping.id} {
      ${dimensionMapping.id} ${prov.hadDictionaryMember} [
        a ${prov.KeyEntityPair} ;
        ${prov.pairKey} ?value ;
        ${prov.pairEntity} ?term
      ]
    }
  `.WHERE`
    {
      ${unmappedValuesSelect}
    }

    GRAPH ${dimensionMapping.id} {
      ${dimensionMapping.id} ${cc.sharedDimension} ?dimension
    }

    SERVICE <${env.PUBLIC_QUERY_ENDPOINT}> {
      {
        ?term ${schema.inDefinedTermSet} ?dimension ;
              ${schema.identifier} ?value .
      } union {
        ?term ${schema.inDefinedTermSet} ?dimension ;
              ${schema.identifier}/${schema.value} ?value .
      }
    }
  `

  await insert.execute(client.query)
}
