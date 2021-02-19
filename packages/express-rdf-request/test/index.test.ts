import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import express from 'express'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { turtle } from '@tpluscode/rdf-string'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { appMock } from '@cube-creator/testing/middleware'
import { cc } from '@cube-creator/testing/lib/namespace'
import { resource } from '..'

describe('middleware/resource', () => {
  it('replaces empty term in body with req.hydra.term', async function () {
    // given
    const app = express()
    const dataset = $rdf.dataset()
    app.use(appMock(hydra => {
      hydra.term = $rdf.namedNode('http://example.com/foo/bar')
      hydra.resource = {
        term: $rdf.namedNode('http://example.com/foo/bar'),
        types: new Set(),
        prefetchDataset: dataset,
        dataset: async () => dataset,
        quadStream() {
          return dataset.toStream()
        },
        async clownface() {
          return clownface({ dataset }).node(this.term)
        },
      }
    }))
    app.use(resource)
    app.use(async (req, res) => {
      const pointer = await req.resource()
      const canonicalTriples = $rdf.dataset([...pointer.dataset]).toCanonical()
      res.send(canonicalTriples)
    })

    // when
    const res = await request(app)
      .post('/')
      .set('content-type', 'text/turtle')
      .send(turtle`<> a ${cc.CubeProject} ; ${rdfs.label} "Test project" .`.toString())

    // then
    expect(res.text).to.matchSnapshot(this)
  })

  it('returns pointer to req.hydra.term if it appears in the body', async function () {
    // given
    const app = express()
    app.use(appMock(hydra => {
      hydra.term = $rdf.namedNode('http://example.com/foo/bar')
    }))
    app.use(resource)
    app.use(async (req, res) => {
      const pointer = await req.resource()
      const canonicalTriples = $rdf.dataset([...pointer.dataset]).toCanonical()
      res.send(canonicalTriples)
    })

    // when
    const res = await request(app)
      .post('/foo/bar')
      .set('host', 'example.com')
      .set('content-type', 'text/turtle')
      .send(turtle`<http://example.com/foo/bar> a ${cc.CubeProject} ; ${rdfs.label} "Test project" .`.toString())

    // then
    expect(res.text).to.matchSnapshot(this)
  })

  it('returns pointer to hydra.request.term if there is no request body', async function () {
    // given
    const app = express()
    app.use(appMock(hydra => {
      hydra.term = $rdf.namedNode('http://example.com/foo/bar')
    }))
    app.use(resource)
    app.use(async (req, res) => {
      const pointer = await req.resource()
      res.send(pointer.value)
    })

    // when
    const res = await request(app)
      .post('/foo/bar')
      .set('host', 'example.com')

    // then
    expect(res.text).to.eq('http://example.com/foo/bar')
  })
})
