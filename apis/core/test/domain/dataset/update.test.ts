import { describe, it, beforeEach } from 'mocha'
import { assert, expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcat, dcterms } from '@tpluscode/rdf-ns-builders'
import { TestResourceStore } from '../../support/TestResourceStore'
import { update } from '../../../lib/domain/dataset/update'

describe('domain/dataset/update', () => {
  let store: TestResourceStore
  const dataset = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
    .addOut(dcterms.title, 'My Title')
    .addOut(dcat.keyword, 'Test')

  beforeEach(() => {
    store = new TestResourceStore([
      dataset,
    ])
  })

  it('update, adds, deletes and  elements', async () => {
    const title = 'My New Title'
    const description = 'Bla bla bla'
    // given
    const updatedResource = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('dataset') })
      .addOut(dcterms.title, title)
      .addOut(dcterms.description, description)

    // when
    const result = await update({ dataset, resource: updatedResource, store })

    // then
    expect(result.out(dcterms.title).value).to.eq(title)
    expect(result.out(dcterms.description).value).to.eq(description)
    expect(result.out(dcat.keyword).value).is.undefined
  })
})
