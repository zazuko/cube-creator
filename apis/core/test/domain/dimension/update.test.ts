import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import sinon from 'sinon'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { prov, rdf, schema, sh, qudt, time } from '@tpluscode/rdf-ns-builders'
import { cc, meta } from '@cube-creator/core/namespace'
import { update } from '../../../lib/domain/dimension/update'
import { TestResourceStore } from '../../support/TestResourceStore'
import { ex } from '@cube-creator/testing/lib/namespace'
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
        dimension.addOut(schema.about, ex.pollutantDimension)
          .addOut(schema.name, $rdf.literal('Year', 'en'))
          .addOut(qudt.scaleType, qudt.IntervalScale)
      })
      .addOut(schema.hasPart, $rdf.namedNode('dimension/station'), dimension => {
        dimension.addOut(schema.about, ex.stationDimension)
          .addOut(schema.name, $rdf.literal('Station', 'en'))
          .addOut(qudt.scaleType, qudt.NominalScale)
          .addOut(cc.dimensionMapping, ex.stationMappingResource)
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
      .addOut(schema.about, ex.pollutantDimension)
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
        hasValue: ex.pollutantDimension,
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
  });

  [qudt.NominalScale, qudt.OrdinalScale].forEach(_scale => {
    it(`initializes a dimension mapping resource when scale of measure is set to ${_scale.value}`, async () => {
      // given
      const dimensionMetadata = namedNode('dimension/pollutant')
        .addOut(schema.about, ex.pollutantDimension)
        .addOut(qudt.scaleType, _scale)
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
          hasValue: ex.pollutantDimension,
        }],
      })
    })
  })

  it('deletes the dimension mapping resource when scale of measure changes to anything but Nominal or Ordinal', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/station')
      .addOut(schema.about, ex.stationDimension)
      .addOut(qudt.scaleType, qudt.IntervalScale)

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

  it('deletes the dimension mapping resource when scale of measure is removed', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/station')
      .addOut(schema.about, ex.stationDimension)

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

  it('keeps dimension mapping resource unchanged when scale of measure does not change', async () => {
    // given
    const dimensionMetadata = namedNode('dimension/station')
      .addOut(schema.about, ex.stationDimension)
      .addOut(qudt.scaleType, qudt.NominalScale)

    // when
    const updated = await update({
      store,
      metadataCollection: metadataCollection.term,
      dimensionMetadata,
    })

    // then
    expect(updated).to.matchShape({
      property: [{
        path: cc.dimensionMapping,
        minCount: 1,
        maxCount: 1,
        hasValue: ex.stationMappingResource,
      }],
    })
  })

  it('replaces child blank nodes recursively', async () => {
    // given
    const dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('dimension')
      .addOut(schema.about, ex.pollutantDimension)
      .addOut(meta.dataKind, dataKind => {
        dataKind.addOut(rdf.type, time.GeneralDateTimeDescription)
        dataKind.addOut(time.unitType, unitType => {
          unitType.addOut(rdf.type, time.Year)
        })
      })

    // when
    const updated = await update({
      store,
      metadataCollection: metadataCollection.term,
      dimensionMetadata,
    })

    // then
    expect(updated).to.matchShape({
      property: [{
        path: schema.about,
      }, {
        path: meta.dataKind,
        node: {
          property: [{
            path: rdf.type,
            hasValue: time.GeneralDateTimeDescription,
            minCount: 1,
            maxCount: 1,
          }, {
            path: time.unitType,
            node: {
              property: {
                path: rdf.type,
                hasValue: time.Year,
                minCount: 1,
                maxCount: 1,
              },
            },
          }],
        },
      }],
    })
  })
})
