import type { NamedNode } from '@rdfjs/types'
import { beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { fromPointer } from '@cube-creator/model/Table'
import { namedNode } from '@cube-creator/testing/clownface'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { getTableReferences } from '../../../lib/domain/queries/table'

describe('@cube-creator/core-api/lib/domain/queries/table @SPARQL', () => {
  beforeEach(async function () {
    this.timeout(20000)
    await insertTestProject()
  })

  describe('getTableReferences', () => {
    it('retrieves expected column mappings', async () => {
      // given
      const table = fromPointer(namedNode('https://cube-creator.lndo.site/cube-project/ubd/csv-mapping/table-station'))

      // when
      const mappings: NamedNode[] = []
      for await (const mapping of getTableReferences(table)) {
        mappings.push(mapping)
      }

      // then
      expect(mappings).to.have.length(1)
      expect(mappings).to.deep.contain.members([
        $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd/csv-mapping/table-observation/column-mapping-2'),
      ])
    })
  })
})
