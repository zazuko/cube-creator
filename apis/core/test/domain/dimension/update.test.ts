import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { rdf, schema, sh, qudt } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { update } from '../../../lib/domain/dimension/update'
import { TestResourceStore } from '../../support/TestResourceStore'
import { ex } from '../../support/namespace'
import '../../../lib/domain'

describe('domain/dimension/update', function () {
  let store: TestResourceStore
  let metadataCollection: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    metadataCollection = clownface({ dataset: $rdf.dataset() })
      .namedNode('metadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('dimension'), dimension => {
        dimension.addOut(schema.about, ex.dimension)
          .addOut(schema.name, $rdf.literal('Year', 'en'))
          .addOut(qudt.scaleType, qudt.IntervalScale)
      })
    store = new TestResourceStore([
      metadataCollection,
    ])
  })

  it('replaces all triples about a dimension', async () => {
    // given
    const dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('dimension')
      .addOut(schema.about, ex.dimension)
      .addOut(schema.name, [
        $rdf.literal('Jahr', 'de'),
        $rdf.literal('Year', 'en'),
      ])
      .addOut(qudt.scaleType, qudt.IntervalScale)
      .addOut(schema.description, [
        $rdf.literal('Das Jahr', 'de'),
        $rdf.literal('The year', 'en'),
      ])

    // when
    const updated = await update({
      store,
      metadataCollection: metadataCollection.term,
      dimensionMetadata,
    })

    // then
    expect(updated.dataset).to.have.property('size').eq(6)
    expect(updated).to.matchShape({
      property: [{
        path: schema.about,
        hasValue: ex.dimension,
        minCount: 1,
        maxCount: 1,
      }, {
        path: qudt.scaleType,
        hasValue: qudt.IntervalScale,
        minCount: 1,
        maxCount: 1,
      }, {
        path: schema.name,
        [sh.hasValue.value]: [
          $rdf.literal('Year', 'en'),
          $rdf.literal('Jahr', 'de'),
        ],
        maxCount: 2,
        minCount: 2,
      }, {
        path: schema.description,
        [sh.hasValue.value]: [
          $rdf.literal('The year', 'en'),
          $rdf.literal('Das Jahr', 'de'),
        ],
        maxCount: 2,
        minCount: 2,
      }],
    })
  })
})
