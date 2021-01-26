import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import sinon from 'sinon'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { prov, rdf, schema, sh, qudt } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { update } from '../../../lib/domain/dimension/update'
import { TestResourceStore } from '../../support/TestResourceStore'
import { ex } from '../../support/namespace'
import '../../../lib/domain'
import { namedNode } from '../../support/clownface'
import * as projectQuery from '../../../lib/domain/queries/cube-project'

describe('domain/dimension/update', function () {
  let store: TestResourceStore
  let metadataCollection: GraphPointer<NamedNode, DatasetExt>
  let findProject: sinon.SinonStub

  beforeEach(() => {
    const project = namedNode(ex('project/test'))

    metadataCollection = namedNode('dimension')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('dimension/pollutant'), dimension => {
        dimension.addOut(schema.about, ex.dimension)
          .addOut(schema.name, $rdf.literal('Year', 'en'))
          .addOut(qudt.scaleType, qudt.IntervalScale)
      })
      .addOut(schema.hasPart, $rdf.namedNode('dimension/station'), dimension => {
        dimension.addOut(schema.about, ex.dimension)
          .addOut(schema.name, $rdf.literal('Station', 'en'))
          .addOut(scale.scaleOfMeasure, scale.Nominal)
      })
    store = new TestResourceStore([
      metadataCollection,
      project,
    ])

    sinon.restore()
    findProject = sinon.stub(projectQuery, 'findProject')
  })

  it('replaces all triples about a dimension', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/pollutant')
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

  it('initializes a dimension mapping resource when scale of measure is set to Nominal', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/pollutant')
      .addOut(schema.about, ex.dimension)
      .addOut(scale.scaleOfMeasure, scale.Nominal)
    findProject.resolves(ex('project/test'))

    // when
    const updated = await update({
      store,
      metadataCollection: metadataCollection.term,
      dimensionMetadata,
    })
    const mappingResource = await store.get(updated.out(cc.dimensionMapping).term)

    // then
    expect(updated).to.matchShape({
      property: [{
        path: cc.dimensionMapping,
        minCount: 1,
        maxCount: 1,
        nodeKind: sh.IRI,
        pattern: 'project\\/test\\/dimension-mapping\\/pollutant-.+$',
      }],
    })
    expect(mappingResource).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: prov.Dictionary,
        minCount: 2,
        maxCount: 2,
      }, {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: ex.dimension,
      }],
    })
  })

  it('deletes the dimension mapping resource when scale of measure changes to anything but Nominal', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/station')
      .addOut(schema.about, ex.dimension)
      .addOut(scale.scaleOfMeasure, scale.Temporal)

    // when
    const updated = await update({
      store,
      metadataCollection: metadataCollection.term,
      dimensionMetadata,
    })
    const mappingResource = await store.get(updated.out(cc.dimensionMapping).term, { allowMissing: true })

    // then
    expect(updated).to.matchShape({
      property: [{
        path: cc.dimensionMapping,
        minCount: 0,
        maxCount: 0,
      }],
    })
    expect(mappingResource).to.be.undefined
  })
})
