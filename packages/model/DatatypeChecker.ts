import { NamedNode } from '@rdfjs/types'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { validators } from 'rdf-validate-datatype'

type Validator = (value: string) => boolean

const getValidator = (name: NamedNode): Validator =>
  validators.find(name) ?? (() => false)

interface Datatype {
  check: Validator
  name: NamedNode
  broader: Datatype[]
}

const getDatatype = (name: NamedNode, ...broader: Datatype[]): Datatype =>
  ({ name, check: getValidator(name), broader })

const getDatatypes = () => {
  // avoid gDay, gMonth and gYear because they are easily confused with integer
  const decimal = getDatatype(xsd.decimal)
  const integer = getDatatype(xsd.integer, decimal)
  const gYearMonth = getDatatype(xsd.gYearMonth)
  const date = getDatatype(xsd.date)
  const time = getDatatype(xsd.time)
  const dateTime = getDatatype(xsd.dateTime)
  const boolean = getDatatype(xsd.boolean)
  // integer before decimal because decimal is broader
  return [integer, decimal, date, time, dateTime, gYearMonth, boolean]
}

const nextUntil = <T>(iterator: Iterator<T>, predicate: (value: T) => boolean) => {
  while (true) {
    const result = iterator.next()
    if (result.done || predicate(result.value)) {
      return result
    }
  }
}

export class DatatypeChecker {
  public determineDatatype(values: Iterable<string>): NamedNode {
    // get the first datatype that matches the first (non-empty) value
    const valueIterator = values[Symbol.iterator]()
    let currentValue = nextUntil(valueIterator, value => value !== '')
    if (currentValue.done) {
      return xsd.string // no values to check
    }
    const datatypeIterator = getDatatypes()[Symbol.iterator]()
    let currentDatatype = nextUntil(datatypeIterator, type => type.check(currentValue.value))
    if (currentDatatype.done) {
      return xsd.string // no datatype found that matches the first value
    }
    // iterate over the rest of the values, moving to broader types if needed
    while (true) {
      currentValue = nextUntil(valueIterator, value => value !== '' && !currentDatatype.value.check(value))
      if (currentValue.done) {
        return currentDatatype.value.name // all values successfuly checked
      }
      // look for broader types
      currentDatatype = nextUntil(currentDatatype.value.broader[Symbol.iterator](), type => type.check(currentValue.value))
      if (currentDatatype.done) {
        return xsd.string // no broader type found that matches the value
      }
    }
  }
}
