import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { dcat, dcterms, hydra, rdf, schema, sh, vcard, _void, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube, lindasSchema } from '@cube-creator/core/namespace'
import { ex } from '@cube-creator/testing/lib/namespace'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore'
import { update } from '../../../lib/domain/dataset/update'

describe('domain/dataset/update', () => {
  let store: TestResourceStore
  let dataset: GraphPointer<NamedNode, DatasetExt>
  let organization: GraphPointer<NamedNode, DatasetExt>
  let project: GraphPointer<NamedNode, DatasetExt>
  let findProject: sinon.SinonStub

  beforeEach(() => {
    dataset = namedNode('dataset')
      .addOut(dcterms.title, 'My Title')
      .addOut(dcat.keyword, 'Test')
    dataset.namedNode('cube')
      .addOut(rdf.type, cube.Cube)
      .addIn(schema.hasPart, dataset)
    project = namedNode('project')
      .addOut(cc.dataset, dataset)
    organization = namedNode('organization/myorg')
    store = new TestResourceStore([
      dataset,
      organization,
      project,
    ])
    findProject = sinon.stub()
  })

  it('update, adds, deletes and  elements', async () => {
    // given
    const title = 'My New Title'
    const description = 'Bla bla bla'
    const updatedResource = namedNode('dataset')
      .addOut(dcterms.title, title)
      .addOut(dcterms.description, description)

    // when
    const result = await update({ dataset, resource: updatedResource, store, findProject })

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
    const updatedResource = namedNode('dataset')
      .addOut(dcterms.title, 'title')
      .addOut(dcterms.temporal, temporal => {
        temporal
          .addOut(dcterms.startDate, $rdf.literal('2000-10-10', xsd.date))
          .addOut(dcterms.endDate, $rdf.literal('2010-10-10', xsd.date))
      })

    // when
    const result = await update({ dataset, resource: updatedResource, store, findProject })

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
    const updatedResource = namedNode('dataset')
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
    const result = await update({ dataset, resource: updatedResource, store, findProject })

    // then
    const cubeTriples = result.dataset.match(dataset.namedNode('cube').term)
    expect(cubeTriples.size).to.eq(1, 'Got: \n' + cubeTriples.toString())
  })

  it('does not keep quads which do not exist in request payload', async () => {
    // given
    dataset.namedNode('foo').addOut(rdf.type, schema.Person)
    const updatedResource = namedNode('dataset')
      .addOut(dcterms.title, 'title')

    // when
    const result = await update({ dataset, resource: updatedResource, store, findProject })

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
    const updatedResource = namedNode('dataset')
      .addOut(dcterms.title, 'title')
      .addOut(schema.hasPart, ex.Foo)
      .addOut(cc.dimensionMetadata, ex.Bar)

    // when
    const result = await update({ dataset, resource: updatedResource, store, findProject })

    // then
    expect(result.out(schema.hasPart).terms).to.not.deep.contain.members([ex.Foo])
    expect(result.out(cc.dimensionMetadata).terms).to.not.deep.contain.members([ex.Bar])
  })

  it('populates schema contact point from dcat contact point', async () => {
    // given
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, 'title')
      .addOut(dcat.contactPoint, org => {
        org
          .addOut(rdf.type, vcard.Organization)
          .addOut(vcard.fn, $rdf.literal('The contact'))
          .addOut(vcard.hasEmail, $rdf.literal('the-contact@example.org'))
      })

    // when
    const result = await update({ dataset, resource: updatedResource, store, findProject })

    // then
    expect(result).to.matchShape({
      property: [{
        path: schema.contactPoint,
        maxCount: 1,
        minCount: 1,
        node: {
          property: [{
            path: rdf.type,
            hasValue: schema.ContactPoint,
            minCount: 1,
            maxCount: 1,
          }, {
            path: schema.name,
            hasValue: $rdf.literal('The contact'),
            minCount: 1,
            maxCount: 1,
          }, {
            path: schema.email,
            hasValue: $rdf.literal('the-contact@example.org'),
            minCount: 1,
            maxCount: 1,
          }],
        },
      }],
    })
  })

  describe('sync project next planned update', () => {
    beforeEach(() => {
      findProject.resolves(project.term)
    })

    it('copies value form dataset and replaces previous', async () => {
      // given
      project.addOut(lindasSchema.datasetNextDateModified, '2000-10-10')
      const updatedResource = namedNode(dataset.term)
        .addOut(lindasSchema.datasetNextDateModified, $rdf.literal('2022-10-10', xsd.date))

      // when
      await update({ dataset, resource: updatedResource, store, findProject })

      // then
      expect(project).to.matchShape({
        property: [{
          path: lindasSchema.datasetNextDateModified,
          maxCount: 1,
          hasValue: $rdf.literal('2022-10-10', xsd.date),
        }],
      })
    })

    it('remove previous value', async () => {
      // given
      project.addOut(lindasSchema.datasetNextDateModified, '2000-10-10')
      const updatedResource = namedNode(dataset.term)

      // when
      await update({ dataset, resource: updatedResource, store, findProject })

      // then
      expect(project).to.matchShape({
        property: [{
          path: lindasSchema.datasetNextDateModified,
          maxCount: 0,
        }],
      })
    })
  })
})
