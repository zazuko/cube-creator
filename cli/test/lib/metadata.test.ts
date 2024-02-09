import type { DatasetCore } from '@rdfjs/types'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { before, describe, it } from 'mocha'
import getStream from 'get-stream'
import { Context } from 'barnard59-core/lib/Pipeline'
import env from '@cube-creator/core/env'
import clownface, { GraphPointer } from 'clownface'
import { expect } from 'chai'
import { VariableMap, Variables } from 'barnard59-core'
import { Hydra } from 'alcaeus/node'
import * as Models from '@cube-creator/model'
import { toRdf } from 'rdf-literal'
import $rdf from 'rdf-ext'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { setupEnv } from '../support/env'
import { loadCubeMetadata } from '../../lib/metadata'
import { logger } from '../support/logger'

Hydra.resources.factory.addMixin(...Object.values(Models))

describe('@cube-creator/cli/lib/metadata @SPARQL', function () {
  this.timeout(20000)

  let context: Context
  let variables: VariableMap

  before(async () => {
    setupEnv()
    await insertTestProject()

    variables = new Map<keyof Variables, any>([
      ['revision', 1],
      ['namespace', 'https://environment.ld.admin.ch/foen/'],
      ['cubeIdentifier', 'ubd/28'],
      ['apiClient', Hydra],
      ['timestamp', toRdf(new Date())],
      ['metadata', $rdf.dataset()],
    ])
    context = {
      variables,
      logger,
    }
  })

  describe('loadCubeMetadata', () => {
    it('should exclude properties of concepts linked from observations', async () => {
      // given
      const jobUri = 'https://cube-creator.lndo.site/cube-project/ubd/csv-mapping/jobs/test-publish-job'

      // when
      const [dataset] = await getStream.array<DatasetCore>(await loadCubeMetadata.call(context, {
        jobUri,
        endpoint: env.STORE_QUERY_ENDPOINT,
      }))

      // then
      const concept = clownface({ dataset })
        .namedNode('https://environment.ld.admin.ch/foen/ubd/28/1/station/blBAS')
      expect(concept.out().terms).to.have.length(0)
      expect(concept.in().terms).to.have.length.greaterThan(0)
    })
  })

  it('should include complete sh:or lists of  properties', async () => {
    // given
    const jobUri = 'https://cube-creator.lndo.site/cube-project/ubd/csv-mapping/jobs/test-publish-job'

    // when
    const [dataset] = await getStream.array<DatasetCore>(await loadCubeMetadata.call(context, {
      jobUri,
      endpoint: env.STORE_QUERY_ENDPOINT,
    }))

    // then
    const shOr = clownface({ dataset })
      .has(sh.path, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/year'))
      .out(sh.or)
      .list()!
    expect([...shOr]).to.containAll((ptr: GraphPointer) => {
      return ptr.has(sh.datatype).terms.length > 0
    })
  })
})
