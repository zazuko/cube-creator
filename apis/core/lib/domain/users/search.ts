import { Pattern } from '@hydrofoil/labyrinth/lib/query/index'
import { sparql } from '@tpluscode/rdf-string'
import { schema } from '@tpluscode/rdf-ns-builders'

export function byName({ subject, object }: Pattern) {
  return sparql`
    ${subject} ${schema.name} ?freetextSearched .

    FILTER(REGEX(?freetextSearched, "${object.value}", "i"))
  `
}
