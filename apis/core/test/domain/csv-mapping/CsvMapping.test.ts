import { describe, it } from 'mocha'
import { expect } from 'chai'
import RdfResourceImpl from '@tpluscode/rdfine'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { CsvMappingMixin, CsvMapping } from '@cube-creator/model/CsvMapping'
import CsvMappingMixinEx from '../../../lib/domain/csv-mapping/CsvMapping'

describe('domain/csv-mapping/CsvMapping', () => {
  class TestCsvMapping extends CsvMappingMixinEx(CsvMappingMixin(RdfResourceImpl)) {
    constructor(init?: Initializer<CsvMapping>) {
      super(clownface({ dataset: $rdf.dataset() }).blankNode(), init)
    }
  }

  describe('create', function () {
    it('ensures a slash if namespace does not have it', () => {
      // given
      const csvMapping = new TestCsvMapping({
        namespace: $rdf.namedNode('http://example.com'),
      })

      // when
      const identifier = csvMapping.createIdentifier('foo/{bar}')

      // then
      expect(identifier.value).to.eq('http://example.com/foo/{bar}')
    })
  })
})
