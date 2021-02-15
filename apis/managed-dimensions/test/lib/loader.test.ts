import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import type { ResourceLoader } from 'hydra-box'
import { INSERT } from '@tpluscode/sparql-builder'
import { mdClients } from '@cube-creator/testing/lib'
import namespace from '@rdfjs/namespace'
import { hydra, schema } from '@tpluscode/rdf-ns-builders'
import Loader from '../../lib/loader'

const ex = namespace('http://example.com/')
const graph = ex('managed-dimensions')
const testResources = INSERT.DATA`
graph ${graph} {
  ${ex.foo} a ${hydra.Resource} ; ${schema.name} "Yes" .
}

graph ${ex('different-graph')} {
  ${ex.foo} a ${schema.Person} ; ${schema.name} "No"  .
  ${ex.bar} a ${hydra.Resource} .
}
`

describe('managed-dimensions/lib/loader @SPARQL', () => {
  const req = {} as any
  let loader: ResourceLoader
  before(async () => {
    loader = new Loader({
      graph,
      stream: mdClients.streamClient,
      sparql: mdClients.parsingClient,
    })
    await testResources.execute(mdClients.parsingClient.query, {
      base: 'http://example.com/',
    })
  })

  describe('forClassOperation', () => {
    it('returns types only from the configured graph', async () => {
      // when
      const [resource] = await loader.forClassOperation(ex.foo, req)

      // then
      expect(resource.types).to.have.property('size', 1)
      expect([...resource.types]).to.deep.contain.members([
        hydra.Resource,
      ])
    })

    it('finds resources only from the configured graph', async () => {
      // when
      const resources = await loader.forClassOperation(ex.bar, req)

      // then
      expect(resources).to.be.empty
    })

    it('attaches described resource quads to resource, sourced only from the configured graph', async () => {
      // when
      const [resource] = await loader.forClassOperation(ex.foo, req)

      // then
      const dataset = await resource.dataset()
      expect(dataset).to.matchShape({
        targetNode: [ex.foo],
        property: {
          path: schema.name,
          maxCount: 1,
          hasValue: 'Yes',
        },
      })
    })
  })

  describe('forPropertyOperation', () => {
    it('returns empty', async () => {
      // when
      const resources = await loader.forPropertyOperation(ex.foo, req)

      // then
      expect(resources).to.be.empty
    })
  })
})
