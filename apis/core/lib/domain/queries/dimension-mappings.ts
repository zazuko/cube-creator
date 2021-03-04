import { Literal, Term } from 'rdf-js'
import { DELETE, SELECT } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'
import { parsingClient, streamClient } from '../../query-client'
import TermSet from '@rdfjs/term-set'

function patternsToFindCubeGraph(dimensionMapping: Term) {
  return sparql`BIND ( ${dimensionMapping} as ?dimensionMapping )

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
}

export async function replaceValueWithDefinedTerms({ dimensionMapping, terms }: { dimensionMapping: Term; terms: TermMap }, client = streamClient): Promise<void> {
  if (terms.size === 0) {
    return
  }

  const pairs = [...terms.entries()].reduce((values, [originalValue, sharedTerm]) => {
    return sparql`${values}\n    ( ${originalValue} ${sharedTerm} )`
  }, sparql``)

  await DELETE`
    graph ?cubeGraph {
      ?listNode ${rdf.first} ?originalValue .
      ?observation ?dimension ?originalValue .
    }
  `.INSERT`
    graph ?cubeGraph {
      ?listNode ${rdf.first} ?sharedTerm .
      ?observation ?dimension ?sharedTerm .
    }
  `.WHERE`
   ${patternsToFindCubeGraph(dimensionMapping)}
  `.WHERE`
    VALUES ( ?originalValue ?sharedTerm ) {
      ${pairs}
    }

    graph ?cubeGraph {
      ?observation a ${cube.Observation} .
      ?shapeProperty ${sh.path} ?dimension .

      OPTIONAL { ?observation ?dimension ?originalValue . }
      OPTIONAL {
        ?shapeProperty ${sh.in}/${rdf.rest}* ?listNode .
        ?listNode ${rdf.first} ?originalValue .
      }
    }
  `.execute(client.query)
}

export async function getUnmappedValues(dimensionMapping: Term, dimension: Term, client = parsingClient): Promise<Set<Literal>> {
  const results = await SELECT.DISTINCT`?value`
    .WHERE`${patternsToFindCubeGraph(dimensionMapping)}`
    .WHERE`{
      SELECT DISTINCT ?value
      WHERE {
        GRAPH ?cubeGraph {
            ?shape a ${cube.Constraint} ; ${sh.property}  ?propShape .
            ?propShape ${sh.path} ${dimension} ;
                       ${sh.in}/${rdf.rest}* ?listNode .
            ?listNode ${rdf.first} ?value .
          }
      }
    }
    UNION
    {
      SELECT DISTINCT ?value
      WHERE {
        GRAPH ?cubeGraph {
           ?observation a ${cube.Observation} ; ${dimension} ?value .
        }
      }
    }

    filter ( !isIRI(?value) )`
    .execute(client.query)

  return results.reduce((missingValues, row) => {
    if (row.value && row.value.termType === 'Literal') {
      return missingValues.add(row.value)
    }

    return missingValues
  }, new TermSet<Literal>())
}
