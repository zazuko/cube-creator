import { describe, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import $rdf from 'rdf-ext'
import StreamClient from 'sparql-http-client'
import clownface, { GraphPointer } from 'clownface'
import { Files } from '@cube-creator/express/multipart'
import { md, meta } from '@cube-creator/core/namespace'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { namedNode } from '@cube-creator/testing/clownface'
import { importDimension } from '../../../../lib/domain/shared-dimension/import'
import { SharedDimensionsStore } from '../../../../lib/store'
import { testStore } from '../../../support/store'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimension/import', () => {
  describe('importDimension', () => {
    let store: SharedDimensionsStore
    let resource: GraphPointer
    let files: Files
    let client: StreamClient

    beforeEach(() => {
      resource = clownface({
        dataset: $rdf.dataset(),
      }).namedNode('')
      files = {}
      store = testStore()
      client = {
        query: {
          update: sinon.spy(),
        },
      } as any
    })

    it('throws when no shared dimension is found in imported data', async () => {
      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith('Import must contain exactly one Shared Dimension')
    })

    it('throws when multiple shared dimension are imported', async () => {
      // given
      resource.addOut(md.export, ['foo.ttl', 'bar.ttl'])

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith('Import must contain exactly one Shared Dimension')
    })

    it('throws when imported data file is missing', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith(/^Missing data for file/)
    })

    it('throws when imported data contains multiple shared dimensions', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        clownface({ dataset })
          .namedNode('dim-1')
          .addOut(rdf.type, md.SharedDimension)
          .namedNode('dim-2')
          .addOut(rdf.type, md.SharedDimension)

        return dataset.toStream()
      }

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith(/exactly one Shared Dimension/)
    })

    it('throws when imported data contains no shared dimensions', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        return $rdf.dataset().toStream()
      }

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith(/exactly one Shared Dimension/)
    })

    it('throws when imported shared dimension is incomplete', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        clownface({ dataset })
          .namedNode('dim')
          .addOut(rdf.type, md.SharedDimension)

        return dataset.toStream()
      }

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith(/invalid/)
    })

    it('throws when shared dimension already exists', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        clownface({ dataset })
          .namedNode('dim')
          .addOut(rdf.type, [
            md.SharedDimension,
            meta.SharedDimension,
            schema.DefinedTermSet,
            hydra.Resource,
          ])
          .addOut(schema.name, $rdf.literal('Dimension', 'en'))
          .addOut(sh.property, null)
          .addIn(sh.targetNode, shape => {
            shape.addOut(sh.property, prop => {
              prop.addOut(sh.path, schema.name)
            })
          })

        return dataset.toStream()
      }
      await store.save(namedNode('dim').addOut(rdf.type, schema.DefinedTermSet))

      // when
      const promise = importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      await expect(promise).to.eventually.be.rejectedWith(/already exists/)
    })

    it('inserts dimension data to database', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        clownface({ dataset })
          .namedNode('dim')
          .addOut(rdf.type, [
            md.SharedDimension,
            meta.SharedDimension,
            schema.DefinedTermSet,
            hydra.Resource,
          ])
          .addOut(schema.name, $rdf.literal('Dimension', 'en'))
          .addOut(sh.property, null)
          .addIn(sh.targetNode, shape => {
            shape.addOut(sh.property, prop => {
              prop.addOut(sh.path, schema.name)
            })
          })

        return dataset.toStream()
      }

      // when
      await importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      expect(client.query.update).to.have.been.calledOnce
    })

    it('returns loaded dimension', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        clownface({ dataset })
          .namedNode('dim')
          .addOut(rdf.type, [
            md.SharedDimension,
            meta.SharedDimension,
            schema.DefinedTermSet,
            hydra.Resource,
          ])
          .addOut(schema.name, $rdf.literal('Dimension', 'en'))
          .addOut(sh.property, null)
          .addIn(sh.targetNode, shape => {
            shape.addOut(sh.property, prop => {
              prop.addOut(sh.path, schema.name)
            })
          })

        return dataset.toStream()
      }

      // when
      await importDimension({
        files,
        store,
        resource,
        client,
      })

      // then
      expect(store.load).to.have.been.calledWithMatch(sinon.match($rdf.namedNode('dim')))
    })
  })
})
