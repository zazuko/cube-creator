import { before, describe, it } from 'mocha'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { expect } from 'chai'
import { ccClients } from '@cube-creator/testing/lib'
import $rdf from '@zazuko/env'
import { cubeNamespaceAllowed } from '../../../lib/domain/organization/query.js'

describe('@cube-creator/core-api/lib/domain/organization/query @SPARQL', () => {
  before(async () => {
    await insertTestProject()
  })

  it('returns true if cube has namespace equal that of organization', async () => {
    // given
    const cube = $rdf.namedNode('https://environment.ld.admin.ch/foen/example/px')
    const org = $rdf.namedNode('https://cube-creator.lndo.site/organization/bafu')

    // when
    const allowed = await cubeNamespaceAllowed(cube, org, ccClients.parsingClient)

    // then
    expect(allowed).to.be.true
  })

  it("returns false if cube has namespace not matching organization's", async () => {
    // given
    const cube = $rdf.namedNode('https://example.com/cube/foo')
    const org = $rdf.namedNode('https://cube-creator.lndo.site/organization/bafu')

    // when
    const allowed = await cubeNamespaceAllowed(cube, org, ccClients.parsingClient)

    // then
    expect(allowed).to.be.false
  })
})
