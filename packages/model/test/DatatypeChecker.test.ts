import { describe, it } from 'mocha'
import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { DatatypeChecker } from '../DatatypeChecker'

const datatypeChecker = new DatatypeChecker()

describe('@cube-creator/model/DatatypeChecker', () => {
  it('recognize datatype', () => {
    expect(datatypeChecker.determineDatatype(['42'])).to.eq(xsd.integer)
    expect(datatypeChecker.determineDatatype(['42', '42'])).to.eq(xsd.integer)
    expect(datatypeChecker.determineDatatype(['42', '42.1'])).to.eq(xsd.decimal)
    expect(datatypeChecker.determineDatatype(['42', 'foo'])).to.eq(xsd.string)
    expect(datatypeChecker.determineDatatype(['2021-01-01', '2021-01-01'])).to.eq(xsd.date)
  })
  it('recognize xsd:string with empty array', () => {
    expect(datatypeChecker.determineDatatype([])).to.eq(xsd.string)
  })
  it('recognize xsd:string with empty string', () => {
    expect(datatypeChecker.determineDatatype([''])).to.eq(xsd.string)
  })
  it('recognize xd:integer ignoring empty strings', () => {
    expect(datatypeChecker.determineDatatype(['', '42', ''])).to.eq(xsd.integer)
  })
})
