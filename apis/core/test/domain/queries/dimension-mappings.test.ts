import { describe, it, beforeEach } from 'mocha'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { getUnmappedValues } from '../../../lib/domain/queries/dimension-mappings'

describe('@cube-creator/core-api/lib/domain/queries/dimension-mappings @SPARQL', function () {
  this.timeout(20000)

  const dimensionMapping = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd/dimension-mapping/pollutant')

  beforeEach(async () => {
    await insertTestProject()
  })

  describe('getUnmappedValues', () => {
    const dimension = $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/pollutant')

    it('returns combined unmapped values from shapes and observations', async () => {
      // when
      const unmappedValues = await getUnmappedValues(dimensionMapping, dimension, ccClients.parsingClient)

      // then
      expect(unmappedValues).to.have.property('size', 3)
      expect([...unmappedValues]).to.have.deep.members([
        $rdf.literal('so2'),
        $rdf.literal('As'),
        $rdf.literal('Pb'),
      ])
    })
  })
})
