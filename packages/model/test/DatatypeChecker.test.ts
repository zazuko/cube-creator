import { describe, it } from 'mocha'
import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { DatatypeChecker } from '../DatatypeChecker'

const datatypeChecker = new DatatypeChecker()

describe('@cube-creator/model/DatatypeChecker', () => {
  it('recognize xsd:integer', () => {
    expect(datatypeChecker.determineDatatype(['42'])).to.eq(xsd.integer)
  })
  it('recognize xsd:decimal', () => {
    expect(datatypeChecker.determineDatatype(['42.1'])).to.eq(xsd.decimal)
  })
  it('recognize xsd:boolean', () => {
    // if the first value was 0 or 1, it would be considered as xsd:integer
    expect(datatypeChecker.determineDatatype(['true', 'false', '0', '1'])).to.eq(xsd.boolean)
  })
  it('recognize xsd:date', () => {
    expect(datatypeChecker.determineDatatype(['2021-01-01'])).to.eq(xsd.date)
  })
  it('recognize xsd:time', () => {
    expect(datatypeChecker.determineDatatype(['23:57:05'])).to.eq(xsd.time)
  })
  it('recognize xsd:dateTime', () => {
    expect(datatypeChecker.determineDatatype(['2021-01-01T23:57:05'])).to.eq(xsd.dateTime)
  })
  it('recognize xsd:gYearMonth', () => {
    expect(datatypeChecker.determineDatatype(['2021-12'])).to.eq(xsd.gYearMonth)
  })
  it('recognize two xsd:integer values', () => {
    expect(datatypeChecker.determineDatatype(['42', '42'])).to.eq(xsd.integer)
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
  it('recognize xsd:string after xsd:date', () => {
    expect(datatypeChecker.determineDatatype(['2021-01-01', 'foo'])).to.eq(xsd.string)
  })
  it('recognize xsd:decimal after xsd:integer', () => {
    expect(datatypeChecker.determineDatatype(['42', '42.1'])).to.eq(xsd.decimal)
  })
  it('recognize xsd:string after xsd:integer', () => {
    expect(datatypeChecker.determineDatatype(['42', 'foo'])).to.eq(xsd.string)
  })
  it('recognize xd:string when mixed types', () => {
    expect(datatypeChecker.determineDatatype(['', '42', '2021-01-01'])).to.eq(xsd.string)
  })
})
