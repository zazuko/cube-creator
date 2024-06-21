import { describe, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env-node'
import StreamClient from 'sparql-http-client'
import type { GraphPointer } from 'clownface'
import { Files } from '@cube-creator/express/multipart'
import { md, meta } from '@cube-creator/core/namespace'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@cube-creator/testing/clownface'
import { ASK } from '@tpluscode/sparql-builder'
import { nanoid } from 'nanoid'
import ValidationReport from 'rdf-validate-shacl/src/validation-report.js'
import { importDimension } from '../../../../lib/domain/shared-dimension/import.js'
import { SharedDimensionsStore } from '../../../../lib/store.js'
import { testStore } from '../../../support/store.js'
import { mdClients } from '../../../../../../packages/testing/lib/index.js'
import env from '../../../../lib/env.js'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimension/import', () => {
  describe('importDimension', () => {
    let store: SharedDimensionsStore
    let resource: GraphPointer
    let files: Files
    let client: StreamClient

    beforeEach(() => {
      resource = $rdf.clownface({
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

        $rdf.clownface({ dataset })
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

    it('returns validation report when imported shared dimension is incomplete', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset })
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
      await expect(promise).to.eventually.be.instanceof(ValidationReport)
    })

    it('throws when shared dimension already exists', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset })
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

    it('inserts dimension data to database with blank nodes preserved @SPARQL', async () => {
      // given
      const dimension = $rdf.namedNode(`${env.MANAGED_DIMENSIONS_BASE}dim-${nanoid()}`)
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset })
          .namedNode(dimension)
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
        client: mdClients.streamClient,
      })

      // then
      const correctlySaved = ASK`
        ${dimension} a ${md.SharedDimension} ; ${sh.property} ?defaultMeta .
        ?shape ${sh.targetNode} ${dimension} .

        FILTER ( isBlank(?defaultMeta) )
        FILTER ( isBlank(?shape) )
      `
        .FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
        .execute(mdClients.streamClient)
      await expect(correctlySaved).to.eventually.be.true
    })

    it('returns loaded dimension', async () => {
      // given
      resource.addOut(md.export, 'dim.ttl')
      files['dim.ttl'] = () => {
        const dataset = $rdf.dataset()

        $rdf.clownface({ dataset })
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
