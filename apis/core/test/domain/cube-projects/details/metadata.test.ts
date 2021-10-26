import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { Draft } from '@cube-creator/model/Cube'
import { projectTargets, projectStatus } from '../../../../lib/domain/cube-projects/details/metadata'
import { removeActivities } from './support'

describe('@cube-creator/core-api/lib/domain/cube-projects/details/metadata @SPARQL', () => {
  const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')

  before(async () => {
    await removeActivities()
    await insertTestProject()
  })

  describe('projectStatus', () => {
    it('returns value from dataset resource', async () => {
      // given
      const [query] = projectStatus(project, $rdf.variable('status'))

      // when
      const [result] = await query.execute(ccClients.parsingClient.query)

      // then
      expect(result.status).to.deep.eq(Draft)
    })
  })

  describe('projectTargets', () => {
    it('returns all schema:workExample from metadata', async () => {
      // given
      const [query] = projectTargets(project, $rdf.variable('targets'))

      // when
      const [result] = await query.execute(ccClients.parsingClient.query)

      // then
      expect(result.targets).to.deep.eq($rdf.namedNode('https://ld.admin.ch/application/visualize'))
    })
  })
})
