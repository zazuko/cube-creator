import * as fs from 'fs'
import path from 'path'
import { before, beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import { ASK } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env'
import { mdClients } from '@cube-creator/testing/lib'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import formats from '@rdfjs/formats'
import type { AnyPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cascadeDelete } from '../../../lib/domain/resource.js'
import { store } from '../../../lib/store.js'
import env from '../../../lib/env.js'

const ns = $rdf.namespace('https://cube-creator.lndo.site/shared-dimensions/')

describe('@cube-creator/shared-dimensions-api/lib/domain/resource @SPARQL', () => {
  const client = mdClients.parsingClient
  let api: AnyPointer

  before(async () => {
    const apiStream = formats.parsers.import('text/turtle', fs.createReadStream(path.join(__dirname, '../../../hydra/index.ttl'))) as any
    api = $rdf.clownface({
      dataset: await $rdf.dataset().import(apiStream),
    })
  })

  beforeEach(async () => {
    await insertTestDimensions()
  })

  describe('cascadeDelete', () => {
    it('deletes leaf resource', async () => {
      // given
      const term = ns('term-set/technologies/rdf')

      // when
      await cascadeDelete({
        store: store(client),
        client,
        api,
        term,
      })

      // then
      await expect(ASK`${term} ?p ?o`.FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)).execute(mdClients.parsingClient))
        .to.eventually.be.false
    })

    it('cascade-deletes following sh:inversePath', async () => {
      // given
      const termSet = ns('term-set/technologies')

      // when
      await cascadeDelete({
        store: store(client),
        client: mdClients.parsingClient,
        api,
        term: termSet,
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // then
      await expect(ASK`?term ${schema.inDefinedTermSet} ${termSet}`.FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)).execute(mdClients.parsingClient))
        .to.eventually.be.false
    })
  })
})
