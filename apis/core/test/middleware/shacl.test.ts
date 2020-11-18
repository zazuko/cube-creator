import { describe, it } from 'mocha'
import express from 'express'
import request from 'supertest'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { NamedNode } from 'rdf-js'
import { hydra, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import clownface, { GraphPointer } from 'clownface'
import { turtle } from '@tpluscode/rdf-string'
import { shaclMiddleware } from '../../lib/middleware/shacl'
import { appMock, mockResourceMiddleware } from '../support/middleware'
import { ex } from '../support/namespace'
import { TestResourceStore } from '../support/TestResourceStore'

describe('middleware/shacl', () => {
  const testResourceStore = (resources: GraphPointer<NamedNode, DatasetExt>[]) => () => new TestResourceStore(resources)
  const loadResourcesTypes = async () => []

  it('calls next middleware when operation does not expect shape', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.NotShape)
    }))
    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([
        clownface({ dataset: $rdf.dataset() }).namedNode(ex.NotShape).addOut(rdf.type, hydra.Class),
      ]),
      loadResourcesTypes,
    }))
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
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
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
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app)
      .post('/')
      .set('content-type', 'text/turtle')
      .send(turtle`<> a ${cc.CubeProject} .`.toString())

    // then
    await response.expect(400)
  })

  it('applies targetNode to request URI when shape has no other target', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
      api.term = ex.resource
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app)
      .put('/')
      .set('content-type', 'text/turtle')
      .send(turtle`${ex.resource} a ${cc.Job} .`.toString())

    // then
    // it should mark invalid based on targetNode
    await response.expect(400)
  })

  it('applies overridden targetNode to validate', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
      getTargetNode() {
        return ex.resource
      },
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app)
      .put('/')
      .set('content-type', 'text/turtle')
      .send(turtle`${ex.resource} a ${cc.Job} .`.toString())

    // then
    // it should mark invalid based on targetNode
    await response.expect(400)
  })

  it('does not fail if body is empty but shape has no properties', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app).post('/')

    // then
    await response.expect(204)
  })

  it('fails if body is empty but shape has targetClass', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
      api.term = ex.Resource
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.targetClass, schema.Person)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app).post('/')

    // then
    await response.expect(400)
  })

  it('fails if body is empty but shape has properties', async () => {
    // given
    const app = express()
    app.use(appMock(api => {
      api.operation.addOut(hydra.expects, ex.Shape)
      api.term = ex.Resource
    }))
    const shape = clownface({ dataset: $rdf.dataset() })
      .namedNode(ex.Shape)
      .addOut(rdf.type, sh.NodeShape)
      .addOut(sh.property, prop => prop.addOut(sh.path, rdfs.label).addOut(sh.minCount, 1))

    app.use(mockResourceMiddleware())
    app.use(shaclMiddleware({
      createResourceStore: testResourceStore([shape]),
      loadResourcesTypes,
    }))
    app.use((req, res) => res.status(204).end())

    // when
    const response = request(app).post('/')

    // then
    await response.expect(400)
  })
})
