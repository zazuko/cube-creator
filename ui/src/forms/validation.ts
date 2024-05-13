import debounce from 'debounce'
import { validate } from '@hydrofoil/shaperone-rdf-validate-shacl'
import type { DatasetCore } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { sh } from '@tpluscode/rdf-ns-builders'

export default debounce(async function (shapes: DatasetCore, data: DatasetCore) {
  const results = await validate(shapes, data)

  // remove class violations from report
  // they are most likely false-negative because they cannot be checked on the client
  $rdf.clownface(results)
    .any()
    .has(sh.sourceConstraintComponent, sh.ClassConstraintComponent)
    .deleteIn()

  return results
}, 500, true)
