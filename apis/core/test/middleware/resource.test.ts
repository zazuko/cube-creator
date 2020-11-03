import { describe, it } from 'mocha'
import request from 'supertest'
import express from 'express'
import $rdf from 'rdf-ext'
import { turtle } from '@tpluscode/rdf-string'
import { cc } from '@cube-creator/core/namespace'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { resource } from '../../lib/middleware/resource'
import { appMock } from '../support/middleware'
import RdfResource from '@tpluscode/rdfine/RdfResource'

describe('middleware/resource', () => {
  it('returns pointer to empty named node if the request term does not appear in body', async () => {
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
      res.send(RdfResource.factory.createEntity(pointer).toJSON())
    })

    // when
    const res = request(app)
      .post('/')
      .set('content-type', 'text/turtle')
      .send(turtle`<> a ${cc.CubeProject} ; ${rdfs.label} "Test project" .`.toString())

    // then
    await res.expect({
      id: '',
      type: ['https://cube-creator.zazuko.com/vocab#CubeProject'],
      'http://www.w3.org/2000/01/rdf-schema#label': 'Test project',
      '@context': { id: '@id', type: '@type' },
    })
  })

  it('returns pointer to hydra.request.resource.term if it appears in the body', async () => {
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
      res.send(RdfResource.factory.createEntity(pointer).toJSON())
    })

    // when
    const res = request(app)
      .post('/foo/bar')
      .set('host', 'example.com')
      .set('content-type', 'text/turtle')
      .send(turtle`<http://example.com/foo/bar> a ${cc.CubeProject} ; ${rdfs.label} "Test project" .`.toString())

    // then
    await res
      .expect(200)
      .expect({
        id: 'http://example.com/foo/bar',
        type: ['https://cube-creator.zazuko.com/vocab#CubeProject'],
        'http://www.w3.org/2000/01/rdf-schema#label': 'Test project',
        '@context': { id: '@id', type: '@type' },
      })
  })
})
