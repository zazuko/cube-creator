import { describe, it, beforeEach } from 'mocha'
import express from 'express'
import request from 'supertest'
import $rdf from '@zazuko/env'
import { Resource } from 'hydra-box'
import { turtle } from '@tpluscode/rdf-string'
import { appMock, mockResourceMiddleware } from '@cube-creator/testing/middleware'
import { ex } from '@cube-creator/testing/lib/namespace'
import { hydra, rdf, sh } from '@tpluscode/rdf-ns-builders'
import { expectsDisambiguate, preferHydraCollection } from '../../lib/middleware/operations.js'

describe('lib/middleware/operations', () => {
  let resource: Resource

  function returnOperations(req: express.Request, res: express.Response) {
    res.send(req.hydra.operations.map(op => op.operation.value))
  }

  beforeEach(() => {
    const dataset = $rdf.dataset()
    resource = {
      prefetchDataset: dataset,
      dataset: async () => dataset,
      quadStream() {
        return dataset.toStream()
      },
      term: ex.resource,
      types: $rdf.termSet(),
    }
  })

  describe('expectsDisambiguate', () => {
    it('does nothing if there is exactly one operation', async () => {
      const app = express()
      app.use(appMock(hydra => {
        hydra.operations = [{
          resource,
          operation: $rdf.clownface(hydra.api).node(ex.Operation),
        }]
      }))
      app.use(expectsDisambiguate)
      app.use(returnOperations)

      // when
      const response = request(app).get('/')

      // then
      await response.expect([
        ex.Operation.value,
      ])
    })

    it('removes operations where the resource does not have all types which operation hydra:expects', async () => {
      const app = express()
      app.use(appMock(hydraBox => {
        hydraBox.operations = [{
          resource,
          operation: $rdf.clownface(hydraBox.api).node(ex.Operation1),
        }, {
          resource,
          operation: $rdf.clownface(hydraBox.api).node(ex.Operation2),
        }]
        $rdf.clownface(hydraBox.api)
          .node(ex.Super)
          .addOut(rdf.type, hydra.Class)
          .addOut(hydra.supportedOperation, ex.Operation1, postSubClass1 => {
            postSubClass1
              .addOut(hydra.expects, [ex.SubClass1, ex.Shape1])
          })
          .addOut(hydra.supportedOperation, ex.Operation2, postSubClass2 => {
            postSubClass2
              .addOut(hydra.expects, [ex.SubClass2, ex.Shape2])
          })
          .node(ex.SubClass1).addOut(rdf.type, hydra.Class)
          .node(ex.SubClass2).addOut(rdf.type, hydra.Class)
          .node([ex.Shape1, ex.Shape2]).addOut(rdf.type, sh.NodeShape)
      }))
      app.use(mockResourceMiddleware())
      app.use(expectsDisambiguate)
      app.use(returnOperations)

      // when
      const response = request(app)
        .post('/')
        .set('content-type', 'text/turtle')
        .send(turtle`<> a ${ex.Super} , ${ex.SubClass2} .`.toString())

      // then
      await response.expect([
        ex.Operation2.value,
      ])
    })
  })

  describe('preferHydraCollection', () => {
    it('remove hydra:Resource operation if there is also one for hydra:Collection', async () => {
      const app = express()
      app.use(appMock(hydraBox => {
        hydraBox.operations = [{
          resource,
          operation: $rdf.clownface(hydraBox.api)
            .node(ex.ResourceOperation)
            .addIn(hydra.supportedOperation, hydra.Resource),
        }, {
          resource,
          operation: $rdf.clownface(hydraBox.api)
            .node(ex.CollectionOperation)
            .addIn(hydra.supportedOperation, hydra.Collection),
        }]
      }))
      app.use(mockResourceMiddleware())
      app.use(preferHydraCollection)
      app.use(returnOperations)

      // when
      const response = request(app).get('/')

      // then
      await response.expect([
        ex.CollectionOperation.value,
      ])
    })
  })
})
