import { expect } from 'chai'
import { describe, it, before } from 'mocha'
import { ccClients } from '@cube-creator/testing/lib'
import $rdf from '@zazuko/env'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { exists } from '../../../lib/domain/cube-projects/queries.js'

const ns = $rdf.namespace('https://cube-creator.lndo.site/')

describe('@cube-creator/core-api/lib/domain/cube-projects/queries @SPARQL', () => {
  before(async () => {
    await insertTestProject()
  })

  it('returns true if there is another csv project with same identifier and maintainer', async () => {
    // when
    const result = await exists('ubd/28', ns('organization/bafu'), ccClients.parsingClient)

    // then
    expect(result).to.be.true
  })

  it('returns true if there is an import project with clashing cube URI', async () => {
    // when
    const result = await exists('example/px-cube', ns('organization/bafu'), ccClients.parsingClient)

    // then
    expect(result).to.be.true
  })

  it('returns true if imported cube is already produced by a CSV project', async () => {
    // given
    const cube = $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28')

    // when
    const result = await exists(cube, ns('organization/bafu'), ccClients.parsingClient)

    // then
    expect(result).to.be.true
  })

  it('returns true if imported cube is already imported by another project', async () => {
    // given
    const cube = $rdf.namedNode('https://environment.ld.admin.ch/foen/example/px-cube')

    // when
    const result = await exists(cube, ns('organization/bafu'), ccClients.parsingClient)

    // then
    expect(result).to.be.true
  })

  it('returns false if there is another project with same identifier but different maintainer', async () => {
    // when
    const result = await exists('ubd/28', ns('organization/bar'), ccClients.parsingClient)

    // then
    expect(result).to.be.false
  })
})
