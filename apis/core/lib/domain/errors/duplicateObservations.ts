import { DELETE, INSERT, SELECT, sparql } from '@tpluscode/sparql-builder'
import { cc, cube } from '@cube-creator/core/namespace'
import { Error } from '@cube-creator/model/Dataset'
import { TransformJob } from '@cube-creator/model/Job'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { streamClient } from '../../query-client'

function findDuplicateObservations(job: TransformJob) {
  return SELECT`?observation`
    .WHERE`
      graph ${job.cubeGraph} {
        ?observation a ${cube.Observation} ; ?dim ?value
        .
      }
    `
    .GROUP().BY('observation').THEN.BY('dim')
    .HAVING`count(distinct ?value) > 1`
    .LIMIT(1)
}

export async function insertDimensionCardinalityError(job: TransformJob, client = streamClient): Promise<void> {
  const deleteCurrent = DELETE`
    graph ?dataset { ?s ?p ?o }
  `.WHERE`
    graph ?dataset {
      ?dataset ${cc.dimensionMetadata} ${job.dimensionMetadata.id} ; ${schema.error} ?currentError .
      ?currentError ${schema.identifier} "${Error.MultipleDimensionValues}" .
      ?currentError (<>|!<>)* ?s .
      ?s ?p ?o .
    }
  `

  const insertNew = INSERT`
    graph ?dataset {
      ?dataset ${schema.error} ?error .
      ?error
          ${schema.identifier} "${Error.MultipleDimensionValues}" ;
          ${schema.description} "Observation identifiers are not unique" ;
          ${schema.additionalProperty} ?errorDim ;
      .
    }
  `.WHERE`
    graph ?dataset {
      ?dataset ${cc.dimensionMetadata} ${job.dimensionMetadata.id} ; a ${schema.Dataset}
    }

    {
      ${findDuplicateObservations(job)}
    }

    FILTER(BOUND(?observation))
    BIND(IRI(CONCAT(STR(?dataset), "#non-unique-observations")) as ?error)
  `

  const updateError = sparql`
    ${deleteCurrent};
    ${insertNew}
  `

  return client.query.update(updateError.toString())
}
