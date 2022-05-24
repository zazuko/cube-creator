import { describe, it, before } from 'mocha'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { ccClients } from '@cube-creator/testing/lib/index'
import { expect } from 'chai'
import namespace from '@rdfjs/namespace'
import { findByDimensionMapping } from '../../../lib/domain/queries/dimension-metadata'

const projectNs = namespace('https://cube-creator.lndo.site/')

describe('@cube-creator/core-api/lib/domain/queries/dimension-metadata @SPARQL', () => {
  before(async () => {
    await insertTestProject()
  })

  it('return the term', async () => {
    // given
    const mapping = projectNs('cube-project/ubd/dimension-mapping/station')

    // when
    const metadata = await findByDimensionMapping(mapping, ccClients.parsingClient)

    // then
    expect(metadata).to.deep.eq(projectNs('cube-project/ubd/dimensions-metadata'))
  })
})
