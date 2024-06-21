import { foaf, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { ex } from '@cube-creator/testing/lib/namespace'
import { ChangelogDataset } from '../lib/ChangelogDataset.js'

describe('ChangelogDataset', () => {
  it('does not have changes when a triple is added and removed', () => {
    // given
    const dataset = new ChangelogDataset($rdf.dataset())

    // when
    dataset.add($rdf.quad(ex.Foo, rdf.type, schema.Person))
    dataset.delete($rdf.quad(ex.Foo, rdf.type, schema.Person))

    // then
    expect(dataset.changes.added).to.have.property('size', 0)
    expect(dataset.changes.deleted).to.have.property('size', 0)
  })

  it('does not have changes when a triple is removed and added again', () => {
    // given
    const dataset = new ChangelogDataset($rdf.dataset([
      $rdf.quad(ex.Foo, rdf.type, schema.Person),
    ]))

    // when
    dataset.delete($rdf.quad(ex.Foo, rdf.type, schema.Person))
    dataset.add($rdf.quad(ex.Foo, rdf.type, schema.Person))

    // then
    expect(dataset.changes.added).to.have.property('size', 0)
    expect(dataset.changes.deleted).to.have.property('size', 0)
  })

  it('does not register changes when a removed triples does not exist', () => {
    // given
    const dataset = new ChangelogDataset($rdf.dataset())

    // when
    dataset.delete($rdf.quad(ex.Foo, rdf.type, schema.Person))

    // then
    expect(dataset.changes.deleted).to.have.property('size', 0)
  })

  describe('.has', () => {
    it('delegates to wrapped dataset', () => {
      // given
      const has = sinon.spy()
      const quad = $rdf.quad(ex.Foo, rdf.type, schema.Person)
      const dataset = new ChangelogDataset({ has } as any)

      // when
      dataset.has(quad)

      // then
      expect(has).to.have.been.calledWith(quad)
    })
  })

  describe('.flush', () => {
    it('resets changes', () => {
    // given
      const dataset = new ChangelogDataset($rdf.dataset())
      dataset.add($rdf.quad(ex.Foo, rdf.type, schema.Person))

      // when
      dataset.flush()

      // then
      expect(dataset.changes.added).to.have.property('size', 0)
      expect(dataset.changes.deleted).to.have.property('size', 0)
    })

    it('returns the changes', () => {
    // given
      const dataset = new ChangelogDataset($rdf.dataset([
        $rdf.quad(ex.Foo, rdf.type, foaf.Person),
      ]))
      dataset.delete($rdf.quad(ex.Foo, rdf.type, foaf.Person))
      dataset.add($rdf.quad(ex.Foo, rdf.type, schema.Person))

      // when
      const changes = dataset.flush()

      // then
      expect(changes.added).to.have.property('size', 1)
      expect(changes.deleted).to.have.property('size', 1)
    })
  })
})
