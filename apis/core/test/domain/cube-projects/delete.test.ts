import { before, beforeEach, describe, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import { ccClients } from '@cube-creator/testing/lib'
import { insertPxCube, insertTestProject } from '@cube-creator/testing/lib/seedData'
import { cc } from '@cube-creator/core/namespace'
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
    await insertPxCube()
  })

  beforeEach(async () => {
    const store = new ResourceStore(ccClients.streamClient)

    await deleteProject({
      resource: project,
      store,
      client: ccClients.parsingClient,
    })
    await store.save()
  })

  it("removes all project's graphs", async () => {
    // then
    const anyGraph = SELECT.DISTINCT`?g`.WHERE`graph ?g {
      ?s ?p ?o
    }

    filter (strstarts(str(?g), "${project.value}"))`.execute(ccClients.parsingClient.query)
    await expect(anyGraph).to.eventually.deep.equal([])
  })

  it('does not touch another project', async () => {
    const pxCube = $rdf.namedNode('cube-project/px')
    const otherProjectStillExists = ASK`graph ${pxCube} {
      ${pxCube} a ${cc.CubeProject}
    }`
      .execute(ccClients.parsingClient.query, {
        base: 'https://cube-creator.lndo.site/',
      })

    // then
    await expect(otherProjectStillExists).to.eventually.be.true
  })

  it('removes sources', async () => {
    // then
    expect(deleteFile).to.have.been.called
  })
})
