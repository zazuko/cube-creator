import { describe, it } from 'mocha'
import { expect } from 'chai'
import { validators } from 'rdf-validate-datatype'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from '@rdfjs/types'

type Validator = (value: string) => boolean

const datatypes: Array<{ check: Validator; name: NamedNode }> = []

const add = (name: NamedNode) => {
  const check = validators.find(name)
  if (check) {
    datatypes.push({ check, name })
  }
}

add(xsd.integer)
add(xsd.decimal)
add(xsd.date)

const datatype = (values: string[]) => {
  let i = 0
  let current = datatypes[i]
  for (const value of values) {
    while (!current.check(value)) {
      if (++i === datatypes.length) {
        return xsd.string
      }
      current = datatypes[i]
    }
  }
  return current.name
}

describe.only('@cube-creator/model/CsvColumn', () => {
  describe('columnDatatype', () => {
    it('recognize integers', () => {
      const isInteger = validators.find(xsd.integer)
      expect(isInteger).to.be.not.null
      if (isInteger) {
        expect(isInteger('42')).to.be.true
        expect(isInteger('-42')).to.be.true
        expect(isInteger('foo')).to.be.false
        expect(isInteger('42.0')).to.be.false
        expect(isInteger('2021-01-01')).to.be.false
      }
    })
    it('recognize decimals', () => {
      const isDecimal = validators.find(xsd.decimal)
      expect(isDecimal).to.be.not.null
      if (isDecimal) {
        expect(isDecimal('42')).to.be.true
        expect(isDecimal('-42')).to.be.true
        expect(isDecimal('foo')).to.be.false
        expect(isDecimal('42.0')).to.be.true
        expect(isDecimal('2021-01-01')).to.be.false
      }
    })
    it('recognize dates', () => {
      const isDate = validators.find(xsd.date)
      expect(isDate).to.be.not.null
      if (isDate) {
        expect(isDate('2021-01-01')).to.be.true
        expect(isDate('2021-01-01T00:00:00Z')).to.be.false
        expect(isDate('foo')).to.be.false
      }
    })
  })
  describe('datatype', () => {
    it('recognize datatype', () => {
      expect(datatype(['42']).equals(xsd.integer)).to.be.true
      expect(datatype(['42', '42']).equals(xsd.integer)).to.be.true
      expect(datatype(['42', '42.1']).equals(xsd.decimal)).to.be.true
      expect(datatype(['42', 'foo']).equals(xsd.string)).to.be.true
      expect(datatype(['2021-01-01', '2021-01-01']).equals(xsd.date)).to.be.true
    })
  })
})
