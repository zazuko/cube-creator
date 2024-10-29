import { NamedNode } from '@rdfjs/types'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { validators } from 'rdf-validate-datatype'

type Validator = (value: string) => boolean

interface Datatype {
  check: Validator
  name: NamedNode
}

export class DatatypeChecker {
  private datatypes: Datatype[] = []

  constructor() {
    this.add(xsd.integer)
    this.add(xsd.decimal)
    this.add(xsd.date)
  }

  private add(name: NamedNode) {
    const check = validators.find(name)
    if (check) {
      this.datatypes.push({ check, name })
    }
  }

  public determineDatatype(values: string[]): NamedNode {
    let i = 0
    let current = this.datatypes[i]
    for (const value of values) {
      while (!current.check(value)) {
        if (++i === this.datatypes.length) {
          return xsd.string
        }
        current = this.datatypes[i]
      }
    }
    return current.name
  }
}
