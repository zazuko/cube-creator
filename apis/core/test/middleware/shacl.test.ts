import { describe, it } from 'mocha'
import express from 'express'
import request from 'supertest'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import { hydra, rdf, rdfs, sh } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import clownface, { GraphPointer } from 'clownface'
import { turtle } from '@tpluscode/rdf-string'
import { shaclMiddleware } from '../../lib/middleware/shacl'
import { appMock, mockResourceMiddleware } from '../support/middleware'
import { ex } from '../support/namespace'
import { TestResourceStore } from '../support/TestResourceStore'

describe('middleware/shacl', () => {
  const testResourceStore = (resources: GraphPointer<NamedNode>[]) => () => new TestResourceStore(resources)

  it('calls next middleware when operation does not expect shape', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.NotShape)
    }))
    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware(testResourceStore([
      clownface({ dataset: $rdf.dataset() }).namedNode(ex.NotShape).addOut(rdf.type, hydra.Class),
    ])))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app).get('/')

    // then
    await response.expect(204)
  })

  it('calls next middleware when payload is validate against shape', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.targetClass, cc.CubeProject)

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware(testResourceStore([shape])))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app)
      .post('/')
      .set('content-type', 'text/turtle')
      .send(turtle`<> a ${cc.CubeProject} ; ${rdfs.label} "Test project" .`.toString())

    // then
    await response.expect(204)
  })

  it('return 400 when payload does not conform to shape', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.targetClass, cc.CubeProject)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware(testResourceStore([shape])))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app)
      .post('/')
      .set('content-type', 'text/turtle')
      .send(turtle`<> a ${cc.CubeProject} .`.toString())

    // then
    await response.expect(400)
  })

  it('return 400 when request has no body', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.targetClass, cc.CubeProject)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware(testResourceStore([shape])))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app).post('/')

    // then
    await response.expect(400)
  })
})
