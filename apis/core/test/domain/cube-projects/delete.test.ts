import { before, beforeEach, describe, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { deleteProject } from '../../../lib/domain/cube-projects/delete'
import ResourceStore from '../../../lib/ResourceStore'
import '../../../lib/domain'
import * as storage from '../../../lib/storage'

describe('@cube-creator/core-api/lib/domain/cube-projects/delete @SPARQL', function () {
  this.timeout(20000)

  const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')
  const deleteFile = sinon.stub()

  before(() => {
    sinon.stub(storage, 'getMediaStorage').returns({
      delete: deleteFile,
    } as any)
  })

  beforeEach(async () => {
    await insertTestProject()
  })

  it("removes all project's graphs", async () => {
    // given
    const store = new ResourceStore(ccClients.streamClient)

    // when
    await deleteProject({
      resource: project,
      store,
      client: ccClients.parsingClient,
    })
    await store.save()

    // then
    const anyGraph = SELECT.DISTINCT`?g`.WHERE`graph ?g {
      ?s ?p ?o
    }

    filter (strstarts(str(?g), "${project.value}"))`.execute(ccClients.parsingClient.query)
    await expect(anyGraph).to.eventually.deep.equal([])
  })

  it('removes sources', async () => {
    // given
    const store = new ResourceStore(ccClients.streamClient)

    // when
    await deleteProject({
      resource: project,
      store,
      client: ccClients.parsingClient,
    })
    await store.save()

    // then
    expect(deleteFile).to.have.been.called
  })
})
