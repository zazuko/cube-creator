import type { Dataset } from '@rdfjs/types'
import { qudt } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env'

export function addQudtHasUnit(dataset: Dataset) {
  dataset.match(null, qudt.unit).forEach(({ subject, object }) => {
    dataset.add($rdf.quad(subject, qudt.hasUnit, object))
  })

  return dataset
}
