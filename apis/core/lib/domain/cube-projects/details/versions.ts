import { SELECT } from '@tpluscode/sparql-builder'
import { Draft, Published } from '@cube-creator/model/Cube'
import { cc } from '@cube-creator/core/namespace'
import type { ProjectDetailPart } from '../details'
import { schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'

export const lastPublishedVersion: ProjectDetailPart = (project, variable) => {
  return [
    SELECT`(MAX(?version) as ${variable})`.WHERE`
      graph ?job {
        ?job a ${cc.PublishJob} ;
           ${cc.revision} ?version ;
           ${cc.project} ${project} ;
           ${schema.creativeWorkStatus} ${Published} ;
           ${schema.actionStatus} ${schema.CompletedActionStatus} ;
        .
      }
    `,
    $rdf.literal('Last published version', 'en'),
  ]
}

export const lastDraftVersion: ProjectDetailPart = (project, variable) => {
  return [
    SELECT`(MAX(?version) as ${variable})`.WHERE`
      graph ?job {
        ?job a ${cc.PublishJob} ;
           ${cc.revision} ?version ;
           ${cc.project} ${project} ;
           ${schema.creativeWorkStatus} ${Draft} ;
           ${schema.actionStatus} ${schema.CompletedActionStatus} ;
        .
      }
    `,
    $rdf.literal('Last draft version', 'en'),
  ]
}
