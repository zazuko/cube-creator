import { Term } from 'rdf-js'
import { DELETE } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { streamClient } from '../../query-client'

export async function replaceValueWithDefinedTerms({ dimensionMapping, terms } : {dimensionMapping: Term; terms: Map<string, Term>}, client = streamClient): Promise<void> {
  if (terms.size === 0) {
    return
  }

  const pairs = [...terms.entries()].reduce((values, [originalValue, managedTerm]) => {
    return sparql`${values}\n    ( ${$rdf.literal(originalValue)} ${managedTerm} )`
  }, sparql``)

  await DELETE`
    graph ?cubeGraph {
      ?listNode ${rdf.first} ?originalValue .
      ?observation ?dimension ?originalValue .
    }
  `.INSERT`
    graph ?cubeGraph {
      ?listNode ${rdf.first} ?managedTerm .
      ?observation ?dimension ?managedTerm .
    }
  `.WHERE`
    BIND ( ${dimensionMapping} as ?dimensionMapping )

    VALUES ( ?originalValue ?managedTerm ) {
      ${pairs}
    }

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
    }

    graph ?cubeGraph {
      ?observation a ${cube.Observation} .
      ?shapeProperty ${sh.path} ?dimension .

      OPTIONAL { ?observation ?dimension ?originalValue . }
      OPTIONAL {
        ?shapeProperty ${sh.in}/${rdf.first}* ?listNode .
        ?listNode ${rdf.first} ?originalValue .
      }
    }
  `.execute(client.query)
}
