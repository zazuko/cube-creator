import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcterms, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import '../../../lib/domain'
import { TestResourceStore } from '../../support/TestResourceStore'
import { createJob } from '../../../lib/domain/job/create'

describe('domain/job/create', () => {
  let store: TestResourceStore
  const project = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myProject') })
    .addOut(cc.csvMapping, $rdf.namedNode('myCsvMapping'))
    .addOut(cc.cubeGraph, $rdf.namedNode('myCubeGraph'))
    .addOut(rdf.type, cc.CubeProject)
  const tableCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myTables') })
  const csvMapping = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myCsvMapping') })
    .addOut(cc.project, project)
    .addOut(cc.tables, tableCollection)
    .addOut(rdf.type, cc.CsvMapping)
  const jobCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('jobs') })
    .addOut(cc.project, project)

  beforeEach(() => {
    store = new TestResourceStore([
      project,
      csvMapping,
      tableCollection,
      jobCollection,
    ])
  })

  it('creates a job', async () => {
    // given

    // when
    const job = await createJob({ resource: jobCollection.term, store })

    // then
    expect(job.out(cc.cubeGraph).value).to.eq('myCubeGraph')
    expect(job.out(cc.tables).value).to.eq('myTables')
    expect(job.out(schema.name).value).to.be.ok
    expect(job.out(dcterms.created).value).to.be.ok
    expect(job.out(schema.actionStatus).term).to.deep.eq(schema.PotentialActionStatus)
  })
})
