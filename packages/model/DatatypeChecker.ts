import { NamedNode } from '@rdfjs/types'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { validators } from 'rdf-validate-datatype'

type Validator = (value: string) => boolean

interface Datatype {
  check: Validator
  name: NamedNode
}

const skipEmpty = function * (values: Iterable<string>) {
  for (const value of values) {
    if (value !== '') {
      yield value
    }
  }
}

const getDatatypes = function * () {
  const datatypes: Datatype[] = []

  const add = (name: NamedNode) => {
    const check = validators.find(name)
    if (check) {
      datatypes.push({ check, name })
    }
  }

  add(xsd.integer)
  add(xsd.decimal)
  add(xsd.date)

  yield * datatypes
}

export class DatatypeChecker {
  public determineDatatype(values: Iterable<string>): NamedNode {
    let count = 0
    const datatypes = getDatatypes()
    let current = datatypes.next().value
    for (const value of skipEmpty(values)) {
      count++
      while (current && !current.check(value)) {
        current = datatypes.next().value
      }
    }
    return count > 0 && current ? current.name : xsd.string
  }
}
