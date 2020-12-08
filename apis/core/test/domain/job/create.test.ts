import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcterms, rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import '../../../lib/domain'
import { TestResourceStore } from '../../support/TestResourceStore'
import { createPublishJob, createTransformJob } from '../../../lib/domain/job/create'
import { DomainError } from '../../../lib/errors'

describe('domain/job/create', () => {
  let store: TestResourceStore
  const project = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('myProject') })
    .addOut(cc.csvMapping, $rdf.namedNode('myCsvMapping'))
    .addOut(cc.cubeGraph, $rdf.namedNode('myCubeGraph'))
    .addOut(cc.publishGraph, $rdf.namedNode('publishGraph'))
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

  describe('createTransformJob', () => {
    it('creates a job resource', async () => {
      // when
      const job = await createTransformJob({ resource: jobCollection.term, store })

      // then
      expect(job.out(cc.cubeGraph).value).to.eq('myCubeGraph')
      expect(job.out(cc.tables).value).to.eq('myTables')
      expect(job.out(schema.name).value).to.be.ok
      expect(job.out(dcterms.created).value).to.be.ok
      expect(job.out(schema.actionStatus).term).to.deep.eq(schema.PotentialActionStatus)
      expect(job.out(rdf.type).values).to.contain(cc.Job.value)
      expect(job.out(rdf.type).values).to.contain(cc.TransformJob.value)
    })
  })

  describe('createPublishJob', () => {
    it('creates a job resource', async () => {
      // when
      const job = await createPublishJob({ resource: jobCollection.term, store })

      // then
      expect(job.has(rdf.type, cc.PublishJob).values.length).to.eq(1)
      expect(job.out(cc.project).value).to.eq('myProject')
      expect(job.out(schema.name).value).to.be.ok
      expect(job.out(dcterms.created).value).to.be.ok
      expect(job.out(schema.actionStatus).term).to.deep.eq(schema.PotentialActionStatus)
      expect(job.out(rdf.type).values).to.contain(cc.Job.value)
      expect(job.out(rdf.type).values).to.contain(cc.PublishJob.value)
    })

    it('sets next revision to job resource', async () => {
      // given
      project.addOut(cc.latestPublishedRevision, 3)

      // when
      const job = await createPublishJob({ resource: jobCollection.term, store })

      // then
      expect(job.out(cc.revision).term).to.deep.eq($rdf.literal('4', xsd.integer))
    })

    it('throws when project has no publish graph', async () => {
      // given
      project.deleteOut(cc.publishGraph)

      // when
      const promise = createPublishJob({ resource: jobCollection.term, store })

      // then
      await expect(promise).rejectedWith(DomainError)
    })
  })
})
