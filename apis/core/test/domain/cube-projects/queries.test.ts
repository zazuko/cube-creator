import namespace from '@rdfjs/namespace'
import { expect } from 'chai'
import { describe, it, before } from 'mocha'
import { ccClients, insertTestProject } from '@cube-creator/testing/lib'
import { exists } from '../../../lib/domain/cube-projects/queries'

const ns = namespace('https://cube-creator.lndo.site/')

describe('@cube-creator/core-api/lib/domain/cube-projects/queries @SPARQL', () => {
  before(async () => {
    await insertTestProject()
  })

  it('returns true if there is another project with same identifier and maintainer', async () => {
    // when
    const result = await exists('ubd/28', ns('organization/bafu'), ccClients.parsingClient)

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
