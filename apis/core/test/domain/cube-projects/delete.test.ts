import { before, beforeEach, describe, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env'
import { ccClients } from '@cube-creator/testing/lib'
import { insertPxCube, insertTestProject } from '@cube-creator/testing/lib/seedData'
import { cc } from '@cube-creator/core/namespace'
import esmock from 'esmock'
import ResourceStore from '../../../lib/ResourceStore.js'
import '../../../lib/domain/index.js'

describe('@cube-creator/core-api/lib/domain/cube-projects/delete @SPARQL', function () {
  this.timeout(20000)

  const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')
  const deleteFile = sinon.stub()

  let deleteProject: typeof import('../../../lib/domain/cube-projects/delete').deleteProject

  before(async () => {
    ({ deleteProject } = await esmock('../../../lib/domain/cube-projects/delete.js', {}, {
      '../../../lib/storage/index.js': {
        getMediaStorage: () => ({
          delete: deleteFile,
        }),
      },
    }))
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

    filter (strstarts(str(?g), "${project.value}"))`.execute(ccClients.parsingClient)
    await expect(anyGraph).to.eventually.deep.equal([])
  })

  it('does not touch another project', async () => {
    const pxCube = $rdf.namedNode('cube-project/px')
    const otherProjectStillExists = ASK`graph ${pxCube} {
      ${pxCube} a ${cc.CubeProject}
    }`
      .execute(ccClients.parsingClient, {
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
