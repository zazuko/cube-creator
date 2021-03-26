import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { dcat, dcterms, hydra, rdf, schema, sh, _void, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { ex } from '@cube-creator/testing/lib/namespace'
import { TestResourceStore } from '../../support/TestResourceStore'
import { update } from '../../../lib/domain/dataset/update'

describe('domain/dataset/update', () => {
  let store: TestResourceStore
  let dataset: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    dataset = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'My Title')
      .addOut(dcat.keyword, 'Test')
    dataset.namedNode('cube')
      .addOut(rdf.type, cube.Cube)
      .addIn(schema.hasPart, dataset)
    store = new TestResourceStore([
      dataset,
    ])
  })

  it('update, adds, deletes and  elements', async () => {
    // given
    const title = 'My New Title'
    const description = 'Bla bla bla'
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, title)
      .addOut(dcterms.description, description)

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    expect(result.out(dcterms.title).value).to.eq(title)
    expect(result.out(dcterms.description).value).to.eq(description)
    expect(result.out(dcat.keyword).value).is.undefined
    expect(dataset).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [schema.Dataset, _void.Dataset, dcat.Dataset],
      }, {
        path: schema.hasPart,
        minCount: 1,
      }],
    })
  })

  it('replaces blank node children', async () => {
    // given
    dataset.addOut(dcterms.temporal, temporal => {
      temporal
        .addOut(dcterms.startDate, $rdf.literal('2010-10-10', xsd.date))
        .addOut(dcterms.endDate, $rdf.literal('2020-10-10', xsd.date))
    })
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'title')
      .addOut(dcterms.temporal, temporal => {
        temporal
          .addOut(dcterms.startDate, $rdf.literal('2000-10-10', xsd.date))
          .addOut(dcterms.endDate, $rdf.literal('2010-10-10', xsd.date))
      })

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    expect(result).to.matchShape({
      property: [{
        path: dcterms.title,
        hasValue: 'title',
        minCount: 1,
        maxCount: 1,
      }, {
        path: dcterms.temporal,
        maxCount: 1,
        minCount: 1,
        node: {
          property: [{
            path: dcterms.startDate,
            hasValue: $rdf.literal('2000-10-10', xsd.date),
            minCount: 1,
            maxCount: 1,
          }, {
            path: dcterms.endDate,
            hasValue: $rdf.literal('2010-10-10', xsd.date),
            minCount: 1,
            maxCount: 1,
          }],
        },
      }],
    })
  })

  it('excludes named node children from stored resource', async () => {
    // given
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'title')
      .addOut(schema.hasPart, dataset.namedNode('cube'), cube => {
        cube.addOut(cc.observations, template => {
          template.addOut(rdf.type, hydra.IriTemplate)
          template.addOut(hydra.mapping, mapping => {
            mapping.addOut(hydra.variable, 'foo')
          })
        })
      })

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    const cubeTriples = result.dataset.match(dataset.namedNode('cube').term)
    expect(cubeTriples.size).to.eq(1, 'Got: \n' + cubeTriples.toString())
  })

  it('does not keep quads which do not exist in request payload', async () => {
    // given
    dataset.namedNode('foo').addOut(rdf.type, schema.Person)
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'title')

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    expect(result.namedNode('foo').out().terms).to.have.length(0)
    expect(result).to.matchShape({
      closed: true,
      property: {
        path: dcterms.title,
        hasValue: 'title',
      },
      ignoredProperties: [
        rdf.type,
        schema.hasPart,
        cc.dimensionMetadata,
      ],
    })
  })

  it('ignores schema:hasPart and cc:dimensionMetadata from the request', async () => {
    // given
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'title')
      .addOut(schema.hasPart, ex.Foo)
      .addOut(cc.dimensionMetadata, ex.Bar)

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    expect(result.out(schema.hasPart).terms).to.not.deep.contain.members([ex.Foo])
    expect(result.out(cc.dimensionMetadata).terms).to.not.deep.contain.members([ex.Bar])
  })
})
