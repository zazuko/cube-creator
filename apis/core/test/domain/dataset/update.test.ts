import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcat, dcterms, rdf, schema, sh, _void } from '@tpluscode/rdf-ns-builders'
import { TestResourceStore } from '../../support/TestResourceStore'
import { update } from '../../../lib/domain/dataset/update'
import { cube } from '@cube-creator/core/namespace'

describe('domain/dataset/update', () => {
  let store: TestResourceStore
  const dataset = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
    .addOut(dcterms.title, 'My Title')
    .addOut(dcat.keyword, 'Test')
  const cubeNode = dataset.namedNode('cube')
    .addOut(rdf.type, cube.Cube)
    .addIn(schema.hasPart, dataset)

  beforeEach(() => {
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
    expect(cubeNode.value).to.eq('cube')
  })
})
