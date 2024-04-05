import { INSERT, SELECT, sparql } from '@tpluscode/sparql-builder'
import { cc, cube } from '@cube-creator/core/namespace'
import { Error } from '@cube-creator/model/Dataset'
import { TransformJob } from '@cube-creator/model/Job'
import { schema } from '@tpluscode/rdf-ns-builders'
import { streamClient } from '../../query-client.js'
import { deleteCurrentError } from './deleteCurrent.js'

function countMissingObservationValues(job: TransformJob) {
  return SELECT`?dataset ?dim (COUNT(?undef) as ?totalUndefined)`
    .WHERE`
      graph ${job.dimensionMetadata.id} {
        ${job.dimensionMetadata.id} ${schema.hasPart} ?dimMeta .
        ?dimMeta ${schema.about} ?dim .
      }

      graph ?dataset {
        ?dataset ${cc.dimensionMetadata} ${job.dimensionMetadata.id}
      }

      graph ?project {
        ?project a ${cc.CubeProject} ; ${cc.dataset} ?dataset
      }

      graph ?cubeGraph {
        ?observation ?dim ?undef
        FILTER (?undef IN (${cube.Undefined}, ""^^${cube.Undefined}) )
      }`
    .GROUP().BY('dataset').THEN.BY('dim')
    .HAVING`?totalUndefined > 0`
}

export async function insertMissingDimensionsError(job: TransformJob, client = streamClient): Promise<void> {
  const insertNew = INSERT`
    graph ?dataset {
      ?dataset ${schema.error} ?error .
      ?error
          ${schema.description} "There are observation values missing for some dimensions" ;
          ${schema.additionalProperty} ?errorDim .
      ?errorDim
          ${schema.name} "Dimension" ;
          ${schema.identifier} ?dim ;
          ${schema.value} ?totalUndefined ;
      .
    }
  `.WHERE`
    {
      ${countMissingObservationValues(job)}
    }

    BIND(IRI(CONCAT(STR(?dataset), "#${Error.MissingObservationValues}")) as ?error)
    BIND(IRI(CONCAT(STR(?dataset), "#${Error.MissingObservationValues}", md5(str(?dim)))) as ?errorDim)
  `

  const updateError = sparql`
    ${deleteCurrentError(Error.MissingObservationValues, job.dimensionMetadata.id)};
    ${insertNew}
  `

  return client.query.update(updateError.toString())
}
