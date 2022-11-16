import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { cc, lindasSchema } from '@cube-creator/core/namespace'
import type { ProjectDetailPart } from '../details.js'

export const plannedUpdate: ProjectDetailPart = (project, variable) => {
  return [
    SELECT`${variable}`.WHERE`
      graph ${project} {
        ${project} ${cc.dataset} ?dataset
      }

      graph ?dataset {
        ?dataset ${lindasSchema.datasetNextDateModified} ${variable}.
      }
    `,
    $rdf.literal('Planned update', 'en'),
  ]
}
