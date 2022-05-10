import { Literal, Term } from 'rdf-js'
import { SELECT } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import TermSet from '@rdfjs/term-set'
import { parsingClient } from '../../query-client'

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

export async function getUnmappedValues(dimensionMapping: Term, dimension: Term, client = parsingClient): Promise<Set<Literal>> {
  const [{ cubeGraph }] = await SELECT`?cubeGraph`
    .WHERE`${patternsToFindCubeGraph(dimensionMapping)}`
    .execute(client.query)

  const results = await SELECT.DISTINCT`?value`
    .FROM(cubeGraph as any)
    .WHERE`{
      SELECT ?value
      WHERE {
        ?shape a ${cube.Constraint} ; ${sh.property}  ?propShape .
        ?propShape ${sh.path} ${dimension} ;
                   ${sh.in}/${rdf.rest}* ?listNode .
        ?listNode ${rdf.first} ?value .
      }
    }
    UNION
    {
      SELECT ?value
      WHERE {
        ?observation a ${cube.Observation} ; ${dimension} ?value .
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
