import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { dcterms, rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import '../../../lib/domain'
import { TestResourceStore } from '../../support/TestResourceStore'
import { createPublishJob, createTransformJob } from '../../../lib/domain/job/create'
import { DomainError } from '@cube-creator/api-errors'
import * as sinon from 'sinon'
import * as Organization from '@cube-creator/model/Organization'
import { namedNode } from '@cube-creator/testing/clownface'
import * as Project from '@cube-creator/model/Project'
import { ex } from '@cube-creator/testing/lib/namespace'

describe('domain/job/create', () => {
  let store: TestResourceStore

  const organization = Organization.fromPointer(namedNode('org'), {
    namespace: $rdf.namedNode('http://example.com/'),
    publishGraph: $rdf.namedNode('publishGraph'),
  })
  const project = Project.fromPointer(namedNode('myProject'), {
    csvMapping: $rdf.namedNode('myCsvMapping'),
    cubeGraph: $rdf.namedNode('myCubeGraph'),
    maintainer: organization,
    cubeIdentifier: 'test-cube',
    dataset: $rdf.namedNode('myDataset'),
  })
  const tableCollection = namedNode('myTables')
  const csvMapping = namedNode('myCsvMapping')
    .addOut(cc.project, project.id)
    .addOut(cc.tables, tableCollection)
    .addOut(rdf.type, cc.CsvMapping)
  const jobCollection = namedNode('jobs')
    .addOut(cc.project, project.id)
  const dimensionCollection = namedNode('myDimensionCollection')
  const dataset = namedNode('myDataset')
    .addOut(cc.dimensionMetadata, dimensionCollection)
    .addOut(schema.creativeWorkStatus, ex.Draft)
    .addOut(schema.workExample, ex.Visualise)

  beforeEach(() => {
    sinon.restore()

    store = new TestResourceStore([
      project,
      csvMapping,
      tableCollection,
      jobCollection,
      dataset,
      organization,
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
      expect(job.out(cc.publishGraph).term).to.deep.eq($rdf.namedNode('publishGraph'))
      expect(job.out(schema.creativeWorkStatus).term).to.deep.eq(ex.Draft)
      expect(job.out(schema.workExample).term).to.deep.eq(ex.Visualise)
    })

    it('sets next revision to job resource', async () => {
      // given
      project.pointer.addOut(cc.latestPublishedRevision, 3)

      // when
      const job = await createPublishJob({ resource: jobCollection.term, store })

      // then
      expect(job.out(cc.revision).term).to.deep.eq($rdf.literal('4', xsd.integer))
    })

    it('throws when organization has no publish graph', async () => {
      // given
      organization.pointer.deleteOut(cc.publishGraph)

      // when
      const promise = createPublishJob({ resource: jobCollection.term, store })

      // then
      await expect(promise).rejectedWith(DomainError)
    })
  })
})
