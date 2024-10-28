import { describe, it } from 'mocha'
import { expect } from 'chai'

const isInteger = (value: string) => /^-?\d+$/.test(value)
const isDecimal = (value: string) => /^-?\d+(\.\d+)?$/.test(value)
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const datatypes = [
  { check: isInteger, name: 'integer' },
  { check: isDecimal, name: 'decimal' },
  { check: isDate, name: 'date' },
]

const datatype = (values: string[]) => {
  let i = 0
  let current = datatypes[i]
  for (const value of values) {
    while (!current.check(value)) {
      if (++i === datatypes.length) {
        return 'string'
      }
      current = datatypes[i]
    }
  }
  return current.name
}

describe('@cube-creator/model/CsvColumn', () => {
  describe('columnDatatype', () => {
    it('recognize integers', () => {
      expect(isInteger('42')).to.be.true
      expect(isInteger('-42')).to.be.true
      expect(isInteger('foo')).to.be.false
      expect(isInteger('42.0')).to.be.false
      expect(isInteger('2021-01-01')).to.be.false
    })
    it('recognize decimals', () => {
      expect(isDecimal('42')).to.be.true
      expect(isDecimal('-42')).to.be.true
      expect(isDecimal('foo')).to.be.false
      expect(isDecimal('42.0')).to.be.true
      expect(isDecimal('2021-01-01')).to.be.false
    })
    it('recognize dates', () => {
      expect(isDate('2021-01-01')).to.be.true
      expect(isDate('2021-01-01T00:00:00Z')).to.be.false
      expect(isDate('foo')).to.be.false
    })
  })
  describe('datatype', () => {
    it('recognize datatype', () => {
      expect(datatype(['42'])).to.equal('integer')
      expect(datatype(['42', '42'])).to.equal('integer')
      expect(datatype(['42', '42.1'])).to.equal('decimal')
      expect(datatype(['42', 'foo'])).to.equal('string')
      expect(datatype(['2021-01-01', '2021-01-01'])).to.equal('date')
    })
  })
})
