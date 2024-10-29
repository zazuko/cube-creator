import { describe, it } from 'mocha'
import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { DatatypeChecker } from '../DatatypeChecker'

const datatypeChecker = new DatatypeChecker()

describe('@cube-creator/model/DatatypeChecker', () => {
  it('recognize datatype', () => {
    expect(datatypeChecker.determineDatatype(['42']).equals(xsd.integer)).to.be.true
    expect(datatypeChecker.determineDatatype(['42', '42']).equals(xsd.integer)).to.be.true
    expect(datatypeChecker.determineDatatype(['42', '42.1']).equals(xsd.decimal)).to.be.true
    expect(datatypeChecker.determineDatatype(['42', 'foo']).equals(xsd.string)).to.be.true
    expect(datatypeChecker.determineDatatype(['2021-01-01', '2021-01-01']).equals(xsd.date)).to.be.true
  })
  it('recognize xsd:string with empty array', () => {
    expect(datatypeChecker.determineDatatype([]).equals(xsd.string)).to.be.true
  })
  it('recognize xsd:string with empty string', () => {
    expect(datatypeChecker.determineDatatype(['']).equals(xsd.string)).to.be.true
  })
  it('recognize xd:integer ignoring empty strings', () => {
    expect(datatypeChecker.determineDatatype(['', '42', '']).equals(xsd.integer)).to.be.true
  })
})
