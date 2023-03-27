import { Literal, NamedNode, Term } from 'rdf-js'
import { Readable } from 'stream'
import { SELECT } from '@tpluscode/sparql-builder'
import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import TermSet from '@rdfjs/term-set'
import { prov } from '@tpluscode/rdf-ns-builders/strict'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { toRdf } from 'rdf-literal'
import through2 from 'through2'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import getStream from 'get-stream'
import { publicClient, streamClient } from '../../query-client'

async function findCubeGraph(dimensionMapping: Term, client: typeof streamClient): Promise<NamedNode> {
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

  const stream = await SELECT`?cubeGraph`
    .WHERE`${patternsToFindCubeGraph}`
    .execute(client.query)

  const [{ cubeGraph }] = await getStream.array<{ cubeGraph: NamedNode }>(stream)
  return cubeGraph
}

function unmappedValuesFromQuery(cubeGraph: NamedNode, dimensionMapping: Term) {
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

export async function getUnmappedValues(dimensionMapping: Term, client = streamClient): Promise<Set<Literal>> {
  const cubeGraph = await findCubeGraph(dimensionMapping, client)

  const stream = await unmappedValuesFromQuery(cubeGraph, dimensionMapping)
    .execute(client.query)

  const unmappedValues = await getStream.array<{ value: Literal }>(stream)
  return new TermSet(unmappedValues.map(result => result.value))
}

interface ImportMappingsFromSharedDimension {
  dimensionMapping: ResourceIdentifier
  dimension: NamedNode
  predicate: NamedNode
  validThrough?: Date
  /**
   * By default, a function will query the database to find unmapped cube values.
   * Override this in automatic tests to with static values
   */
  unmappedValuesOverride?: Literal[]
}

export async function importMappingsFromSharedDimension({ dimensionMapping, dimension, predicate, unmappedValuesOverride, validThrough }: ImportMappingsFromSharedDimension, client = streamClient) {
  let unmappedValues: AsyncIterable<{ value: Literal }> | Iterable<{ value: Literal }>
  if (unmappedValuesOverride != null) {
    unmappedValues = unmappedValuesOverride.map(value => ({ value }))
  } else {
    const cubeGraph = await findCubeGraph(dimensionMapping, client)
    unmappedValues = await unmappedValuesFromQuery(cubeGraph, dimensionMapping).execute(client.query)
  }

  const terms = await getSharedDimensionTerms({ dimension, predicate, validThrough })
  const newMappings = through2.obj(function ({ value }: { value: Literal }, _, next) {
    const pair = terms.get(value.value)
    if (!pair) {
      return next()
    }

    const pointer = clownface({ dataset: $rdf.dataset(), graph: dimensionMapping })
      .node(dimensionMapping)
      .addOut(prov.hadDictionaryMember, member => {
        member
          .addOut(rdf.type, prov.KeyEntityPair)
          .addOut(prov.pairKey, pair.key)
          .addOut(prov.pairEntity, pair.entity)
      })

    for (const quad of pointer.dataset) {
      this.push(quad)
    }
    return next()
  })

  await client.store.post(Readable.from(unmappedValues).pipe(newMappings))
}

interface GetSharedDimensionTerms {
  dimension: NamedNode
  predicate: NamedNode
  validThrough?: Date
}

async function getSharedDimensionTerms({ dimension, predicate, validThrough }: GetSharedDimensionTerms): Promise<Map<string, { entity: Term; key: Literal }>> {
  let validThroughFilter: SparqlTemplateResult | string = ''
  if (validThrough) {
    validThroughFilter = sparql`
      OPTIONAL { ?term ${schema.validThrough} ?validThrough }
      FILTER (!bound(?validThrough) || ?validThrough >= ${toRdf(validThrough)})
    `
  }

  const bindings: Array<{ term: Term; identifier: Literal }> = await SELECT`?term ?identifier`
    .WHERE`
      {
        ?term ${schema.inDefinedTermSet} ${dimension} ;
              ${predicate} ?identifier .

        FILTER (!isblank(?identifier))
      } union {
        ?term ${schema.inDefinedTermSet} ${dimension} ;
              ${predicate}/${schema.value} ?identifier .
      }

      ${validThroughFilter}
    `
    .execute(publicClient.query) as any

  return new Map(bindings.map(({ identifier, term }) => [identifier.value, { key: identifier, entity: term }]))
}
