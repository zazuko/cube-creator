import { INSERT, SELECT, sparql } from '@tpluscode/sparql-builder'
import { cc, cube } from '@cube-creator/core/namespace'
import { Error } from '@cube-creator/model/Dataset'
import { TransformJob } from '@cube-creator/model/Job'
import { schema } from '@tpluscode/rdf-ns-builders'
import { streamClient } from '../../query-client.js'
import { deleteCurrentError } from './deleteCurrent.js'

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
  const insertNew = INSERT`
    graph ?dataset {
      ?dataset ${schema.error} ?error .
      ?error
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
    BIND(IRI(CONCAT(STR(?dataset), "#${Error.MultipleDimensionValues}")) as ?error)
  `

  const updateError = sparql`
    ${deleteCurrentError(Error.MultipleDimensionValues, job.dimensionMetadata.id)};
    ${insertNew}
  `

  return client.query.update(updateError.toString())
}
