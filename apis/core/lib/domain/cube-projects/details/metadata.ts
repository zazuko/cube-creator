import { SELECT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import type { ProjectDetailPart } from '../details.js'

export const projectStatus: ProjectDetailPart = (project, status) => {
  return [
    SELECT`${status}`.WHERE`
      graph ${project} {
        ${project} ${cc.dataset} ?dataset
      }

      graph ?dataset {
        ?dataset ${schema.creativeWorkStatus} ${status}.
      }
    `,
    $rdf.literal('Status', 'en'),
  ]
}

export const projectTargets: ProjectDetailPart = (project, target) => {
  return [
    SELECT`${target}`.WHERE`
      graph ${project} {
        ${project} ${cc.dataset} ?dataset
      }

      graph ?dataset {
        ?dataset ${schema.workExample} ${target} .
      }
    `,
    $rdf.literal('Target', 'en'),
  ]
}
