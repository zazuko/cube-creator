import { describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import express from 'express'
import $rdf from 'rdf-ext'
import { turtle } from '@tpluscode/rdf-string'
import { cc } from '@cube-creator/core/namespace'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { resource } from '../../lib/middleware/resource'
import { appMock } from '../support/middleware'

describe('middleware/resource', () => {
  it('returns pointer to empty named node if the request term does not appear in body', async function () {
    // given
    const app = express()
    app.use(appMock(hydra => {
      hydra.resource = {
        term: $rdf.namedNode('http://example.com/foo/bar'),
        types: new Set(),
        dataset: $rdf.dataset(),
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

  it('returns pointer to hydra.request.resource.term if it appears in the body', async function () {
    // given
    const app = express()
    app.use(appMock(hydra => {
      hydra.resource = {
        term: $rdf.namedNode('http://example.com/foo/bar'),
        types: new Set(),
        dataset: $rdf.dataset(),
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
