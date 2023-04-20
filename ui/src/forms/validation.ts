import debounce from 'debounce'
import { validate } from '@hydrofoil/shaperone-rdf-validate-shacl'
import { DatasetCore } from 'rdf-js'
import clownface from 'clownface'
import { sh } from '@tpluscode/rdf-ns-builders'

export default debounce(async function (shapes: DatasetCore, data: DatasetCore) {
  const results = await validate(shapes, data)

  // remove class violations from report
  // they are most likely false-negative because they cannot be checked on the client
  clownface(results)
    .any()
    .has(sh.sourceConstraintComponent, sh.ClassConstraintComponent)
    .deleteIn()

  return results
}, 500, true)
