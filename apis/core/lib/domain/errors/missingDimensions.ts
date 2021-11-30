import { DELETE, SELECT } from '@tpluscode/sparql-builder'
import { cc, cube } from '@cube-creator/core/namespace'
import { Error } from '@cube-creator/model/Dataset'
import { TransformJob } from '@cube-creator/model/Job'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { streamClient } from '../../query-client'

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
  const update = DELETE`
    graph ?dataset { ?s ?p ?o }
  `.INSERT`
    graph ?dataset {
      ?dataset ${schema.error} ?error .
      ?error
          ${schema.identifier} "${Error.MissingObservationValues}" ;
          ${schema.description} "There are observation values missing for some dimensions" ;
          ${schema.additionalProperty} ?errorDim .
      ?errorDim
          ${schema.name} "Dimension" ;
          ${schema.identifier} ?dim ;
          ${schema.value} ?totalUndefined ;
      .
    }
  `.WHERE`
    optional {
      SELECT * {
        graph ?dataset {
          ?dataset ${cc.dimensionMetadata} ${job.dimensionMetadata.id} ; ${schema.error} ?currentError .
          ?currentError ${schema.identifier} "${Error.MissingObservationValues}" .
          ?currentError (<>|!<>)* ?s .
          ?s ?p ?o .
        }
      }
    }

    {
      ${countMissingObservationValues(job)}
    }

    BIND(IRI(CONCAT(STR(?dataset), "#missing-values-error")) as ?error)
    BIND(IRI(CONCAT(STR(?dataset), "#missing-values-error/", md5(str(?dim)))) as ?errorDim)
  `

  return update.execute(client.query)
}
