import { describe, it, before } from 'mocha'
import $rdf from '@zazuko/env'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { expect } from 'chai'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { lastModification } from '../../../../lib/domain/cube-projects/details/lastModification.js'
import { removeActivities } from './support.js'

describe('@cube-creator/core-api/lib/domain/cube-projects/details/lastModification @SPARQL', () => {
  const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')

  before(async function () {
    this.timeout(10000)
    await removeActivities()
    await insertTestProject()
  })

  it("returns the last date from all project's activities", async () => {
    // given
    const [query] = lastModification(project, $rdf.variable('lastModification'))

    // when
    const [result] = await query.execute(ccClients.parsingClient)

    // then
    expect(result.lastModification).to.deep.eq($rdf.literal('2020-10-30T12:01:00', xsd.dateTime))
  })
})
