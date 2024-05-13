import type { DatasetCore } from '@rdfjs/types'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { before, describe, it } from 'mocha'
import getStream from 'get-stream'
import type { Context, VariableMap, Variables } from 'barnard59-core'
import env from '@cube-creator/core/env/node'
import type { GraphPointer } from 'clownface'
import { expect } from 'chai'
import { toRdf } from 'rdf-literal'
import $rdf from '@zazuko/env'
import { sh } from '@tpluscode/rdf-ns-builders'
import { CCEnv } from '@cube-creator/env'
import { setupEnv } from '../support/env.js'
import { loadCubeMetadata } from '../../lib/metadata.js'
import { logger } from '../support/logger.js'

describe('@cube-creator/cli/lib/metadata @SPARQL', function () {
  this.timeout(20000)

  let context: Context<CCEnv>
  let variables: VariableMap

  before(async () => {
    setupEnv()
    await insertTestProject()

    variables = new Map<keyof Variables, any>([
      ['revision', 1],
      ['namespace', 'https://environment.ld.admin.ch/foen/'],
      ['cubeIdentifier', 'ubd/28'],
      ['timestamp', toRdf(new Date())],
      ['metadata', $rdf.dataset()],
    ])
    context = {
      variables,
      logger,
    } as any
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
      const concept = $rdf.clownface({ dataset })
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
    const shOr = $rdf.clownface({ dataset })
      .has(sh.path, $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/year'))
      .out(sh.or)
      .list()!
    expect([...shOr]).to.containAll((ptr: GraphPointer) => {
      return ptr.has(sh.datatype).terms.length > 0
    })
  })
})
