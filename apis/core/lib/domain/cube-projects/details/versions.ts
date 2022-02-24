import { Term } from 'rdf-js'
import { SELECT } from '@tpluscode/sparql-builder'
import { Draft, Published } from '@cube-creator/model/Cube'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import type { ProjectDetailPart } from '../details.js'

function versionQuery(project: Term, variable: Term, status: Term) {
  return SELECT`(MAX(?version) as ${variable})`.WHERE`
      graph ?job {
        ?job a ${cc.PublishJob} ;
           ${cc.revision} ?version ;
           ${cc.project} ${project} ;
           ${schema.creativeWorkStatus} ${status} ;
           ${schema.actionStatus} ${schema.CompletedActionStatus} ;
        .
      }
    `
}

export const lastPublishedVersion: ProjectDetailPart = (project, variable) => {
  return [
    versionQuery(project, variable, Published),
    $rdf.literal('Last published version', 'en'),
  ]
}

export const lastDraftVersion: ProjectDetailPart = (project, variable) => {
  return [
    versionQuery(project, variable, Draft),
    $rdf.literal('Last draft version', 'en'),
  ]
}
