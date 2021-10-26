import { SELECT } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { as } from '@tpluscode/rdf-ns-builders/strict'
import $rdf from 'rdf-ext'
import type { ProjectDetailPart } from '../details.js'

export const lastModification: ProjectDetailPart = (project, variable) => {
  return [
    SELECT`(MAX(?time) as ${variable})`.WHERE`
      graph ?activity {
        ?activity a ?type .
        FILTER (?type ${IN(as.Create, as.Update, as.Delete)} )

        ?activity ${as.object} ?object .
        FILTER (STRSTARTS(str(?object), "${project.value}"))

        ?activity ${as.startTime} ?time .
      }
    `,
    $rdf.literal('Last Modification', 'en'),
  ]
}
