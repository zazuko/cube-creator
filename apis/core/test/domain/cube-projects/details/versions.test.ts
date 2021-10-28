import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { toRdf } from 'rdf-literal'
import { lastDraftVersion, lastPublishedVersion } from '../../../../lib/domain/cube-projects/details/versions'
import { removeActivities } from './support'

describe('@cube-creator/core-api/lib/domain/cube-projects/details/versions @SPARQL', () => {
  const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')

  before(async () => {
    await removeActivities()
    await insertTestProject()
  })

  describe('lastDraftVersion', () => {
    it('returns last version from most recent completed publish job', async () => {
      // given
      const [query] = lastDraftVersion(project, $rdf.variable('lastVersion'))

      // when
      const [result] = await query.execute(ccClients.parsingClient.query)

      // then
      expect(result.lastVersion).to.deep.eq(toRdf(1))
    })
  })

  describe('lastPublishedVersion', () => {
    it('returns last version from most recent completed publish job', async () => {
      // given
      const [query] = lastPublishedVersion(project, $rdf.variable('lastVersion'))

      // when
      const [result] = await query.execute(ccClients.parsingClient.query)

      // then
      expect(result).to.be.undefined
    })
  })
})
