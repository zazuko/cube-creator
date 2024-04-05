import path from 'path'
import { describe, beforeEach, it } from 'mocha'
import request from 'supertest'
import express from 'express'
import asyncMiddleware from 'middleware-async'
import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { isMultipart, multiPartResourceHandler } from '../multipart.js'

describe('@cube-creator/express/multipart', () => {
  describe('isMultipart', () => {
    const testHandler: express.RequestHandler = (req, res) => {
      res.status(isMultipart(req) ? 200 : 400).end()
    }

    it('returns true for a valid multipart content type', async () => {
      // given
      const app = express()
      app.use(testHandler)

      // when
      const response = request(app)
        .post('/')
        .set('content-type', 'multipart/form-data; boundary=----foo')

      // then
      await response.expect(200)
    })
  })

  describe('multiPartResourceHandler', () => {
    let app: express.Express

    beforeEach(() => {
      app = express()
        .use(multiPartResourceHandler)
        .use(function mockHydra(req, res, next) {
          req.hydra = {
            term: $rdf.namedNode('http://example.com/'),
          } as any
          next()
        })
    })

    describe('req.parseFromMultipart', () => {
      it('return 400 when request is not multipart', async () => {
        // given
        app.use(asyncMiddleware(async (req) => {
          await req.parseFromMultipart()
        }))

        // when
        const response = request(app)
          .post('/')
          .set('content-type', 'text/turtle')

        // then
        const { error } = await response.expect(400)
        expect(error).to.have.property('text').to.contain('Unexpected multipart body')
      })

      it('returns 400 when there is no field "representation"', async () => {
        // given
        app.use(asyncMiddleware(async (req) => {
          await req.parseFromMultipart()
        }))

        // when
        const response = request(app)
          .post('/')
          .type('form')
          .attach('foo', path.join(__dirname, 'multipart/valid-body.ttl'))

        // then
        const { error } = await response.expect(400)
        expect(error).to.have.property('text').to.contain('Missing request part')
      })

      it('returns parsed representation part', async () => {
        // given
        app.use(asyncMiddleware(async (req, res) => {
          const representation = await req.parseFromMultipart()
          res.send(representation.any().has(rdf.type, schema.Person).value)
        }))

        // when
        const response = request(app)
          .post('/')
          .type('form')
          .attach('representation', path.join(__dirname, 'multipart/valid-body.ttl'), {
            contentType: 'text/turtle',
          })

        // then
        await response.expect(200)
          .expect('http://example.com/john-doe')
      })

      it('auto-detects media type', async () => {
        // given
        app.use(asyncMiddleware(async (req, res) => {
          const representation = await req.parseFromMultipart()
          res.send(representation.any().has(rdf.type, schema.Person).value)
        }))

        // when
        const response = request(app)
          .post('/')
          .type('form')
          .attach('representation', path.join(__dirname, 'multipart/valid-body.ttl'))

        // then
        await response.expect(200)
          .expect('http://example.com/john-doe')
      })

      it('returns 400 when part has unrecognized media type', async () => {
        // given
        app.use(asyncMiddleware(async (req, res) => {
          const representation = await req.parseFromMultipart()
          res.send(representation.has(rdf.type, schema.Person).value)
        }))

        // when
        const response = request(app)
          .post('/')
          .type('form')
          .attach('representation', path.join(__dirname, 'multipart/valid-body.ttl'), {
            contentType: 'text/x-rdf',
            filename: 'valid-body.xrdf',
          })

        // then
        await response.expect(400)
      })
    })

    describe('req.multipartFileQuadsStreams', () => {
      it('parses given file using provided base IRI', async () => {
        // given
        app.use(asyncMiddleware(async (req, res) => {
          const { part } = req.multipartFileQuadsStreams()
          const dataset = await $rdf.dataset().import(part('http://foo.bar/baz/'))
          const parsed = $rdf.clownface({ dataset })
          res.send(parsed.has(rdf.type, schema.Person).value)
        }))

        // when
        const response = request(app)
          .post('/')
          .type('form')
          .attach('part', path.join(__dirname, 'multipart/valid-body.ttl'))

        // then
        await response.expect(200)
          .expect('http://foo.bar/baz/john-doe')
      })
    })
  })
})
