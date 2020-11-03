import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

import { TestResourceStore } from '../../support/TestResourceStore'
import { createJob } from '../../../lib/domain/job/create'

describe('domain/job/create', () => {
  let store: TestResourceStore
  const project = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myProject') }).addOut(cc.csvMapping, $rdf.namedNode('myCsvMapping')).addOut(cc.cubeGraph, $rdf.namedNode('myCubeGraph')).addOut(rdfs.label, 'My Cube Name')
  
  const tableCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myTables') })
  const csvMapping = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myCsvMapping') }).addOut(cc.project, project).addOut(cc.tables, tableCollection)
  const jobCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('jobs') }).addOut(cc.csvMapping, csvMapping)

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
    expect(job.out(rdfs.label).value).to.eq('My Cube Name')
  })
})
