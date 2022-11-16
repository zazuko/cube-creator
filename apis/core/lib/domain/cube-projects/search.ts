import { Pattern } from '@hydrofoil/labyrinth/lib/query'
import { sparql } from '@tpluscode/rdf-string'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export function byFreeText({ subject, object }: Pattern) {
  return sparql`
    ${subject} ${rdfs.label}|${schema.alternateName}|${schema.disambiguatingDescription} ?freetextSearched .

    FILTER(REGEX(?freetextSearched, "${object.value}", "i"))
  `
}

export function byStatus({ subject, predicate, object }: Pattern) {
  return sparql`
    ${subject} ${cc.dataset} ?dataset .

    graph ?dataset {
      ?dataset ${predicate} ${object.term} .
    }
  `
}

export function byUser({ subject, predicate, object }: Pattern) {
  return sparql`
    ${subject} ${predicate} ${object.term} .
  `
}
