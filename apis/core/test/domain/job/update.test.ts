import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { dcterms, rdf, rdfs, schema, xsd, _void } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import { update } from '../../../lib/domain/job/update.js'
import '../../../lib/domain/index.js'

describe('domain/job/update', () => {
  let job: GraphPointer<NamedNode, DatasetExt>
  let project: GraphPointer<NamedNode, DatasetExt>
  let dataset: GraphPointer<NamedNode, DatasetExt>
  let maintainer: GraphPointer<NamedNode, DatasetExt>
  let store: TestResourceStore

  beforeEach(() => {
    maintainer = namedNode('org')
      .addOut(rdf.type, schema.Organization)
      .addOut(cc.namespace, 'http://example.com/')
    job = $rdf.clownface()
      .namedNode('job')
      .addOut(rdf.type, cc.Job)
    project = $rdf.clownface()
      .namedNode('project')
      .addOut(rdf.type, cc.CubeProject)
      .addOut(cc.latestPublishedRevision, 2)
      .addOut(cc.dataset, $rdf.namedNode('dataset'))
      .addOut(schema.maintainer, maintainer)
    dataset = $rdf.clownface()
      .namedNode('dataset')
      .addOut(rdf.type, _void.Dataset)

    store = new TestResourceStore([
      job,
      project,
      dataset,
      maintainer,
    ])
  })

  it('updates status', async () => {
    // given
    const resource = $rdf.clownface()
      .namedNode('job')
      .addOut(schema.actionStatus, schema.FailedActionStatus)

    // when
    await update({
      resource,
      store,
    })

    // then
    expect(job).to.matchShape({
      property: {
        path: schema.actionStatus,
        hasValue: schema.FailedActionStatus,
        maxCount: 1,
      },
    })
  })

  it('updates execution link', async () => {
    // given
    const resource = $rdf.clownface()
      .namedNode('job')
      .addOut(rdfs.seeAlso, $rdf.namedNode('http://gitlab.link/'))

    // when
    await update({
      resource,
      store,
    })

    // then
    expect(job).to.matchShape({
      property: {
        path: rdfs.seeAlso,
        hasValue: $rdf.namedNode('http://gitlab.link/'),
        maxCount: 1,
      },
    })
  })

  it('clears error if not in payload', async () => {
    // given
    job.addOut(schema.error, error => {
      error.addOut(schema.description, 'Previous error')
    })
    const resource = $rdf.clownface()
      .namedNode('job')
      .addOut(rdfs.seeAlso, $rdf.namedNode('http://gitlab.link/'))

    // when
    await update({
      resource,
      store,
    })

    // then
    expect(job).to.matchShape({
      property: {
        path: schema.error,
        maxCount: 0,
      },
    })
  })

  it('sets error if in payload', async () => {
    // given
    job.addOut(schema.error, error => {
      error.addOut(schema.description, 'Previous error')
    })
    const resource = $rdf.clownface()
      .namedNode('job')
      .addOut(rdfs.seeAlso, $rdf.namedNode('http://gitlab.link/'))
      .addOut(schema.error, error => {
        error.addOut(schema.description, 'New error')
      })

    // when
    await update({
      resource,
      store,
    })

    // then
    expect(job).to.matchShape({
      property: {
        path: schema.error,
        node: {
          property: {
            path: schema.description,
            hasValue: 'New error',
            minCount: 1,
          },
        },
        minCount: 1,
      },
    })
  })

  describe('publish job', () => {
    beforeEach(() => {
      job
        .addOut(rdf.type, cc.PublishJob)
        .addOut(cc.project, project)
        .addOut(cc.publishGraph, job.namedNode('http://example.com/publish-graph'))
    })

    it("increments project's cc:publishedRevision when succeeded", async () => {
      // given
      const resource = $rdf.clownface()
        .namedNode('job')
        .addOut(schema.actionStatus, schema.CompletedActionStatus)

      // when
      await update({
        resource,
        store,
      })

      // then
      expect(project).to.matchShape({
        property: {
          path: cc.latestPublishedRevision,
          hasValue: $rdf.literal('3', xsd.integer),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('sets dataset published date on first revision', async () => {
      // given
      const resource = $rdf.clownface()
        .namedNode('job')
        .addOut(schema.actionStatus, schema.CompletedActionStatus)
        .addOut(dcterms.modified, $rdf.literal('2020-12-12T11:30:30', xsd.dateTime))
      job
        .addOut(cc.revision, 1)

      // when
      await update({
        resource,
        store,
      })

      // then
      expect(dataset).to.matchShape({
        property: {
          path: schema.datePublished,
          hasValue: $rdf.literal('2020-12-12', xsd.date),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('does not change dataset published date on first revision', async () => {
      // given
      const resource = $rdf.clownface({ dataset: $rdf.dataset() })
        .namedNode('job')
        .addOut(schema.actionStatus, schema.CompletedActionStatus)
        .addOut(dcterms.modified, $rdf.literal('2020-12-12T11:30:30', xsd.dateTime))
      job
        .addOut(cc.revision, 1)
      dataset.addOut(schema.datePublished, $rdf.literal('2020-10-12', xsd.date))

      // when
      await update({
        resource,
        store,
      })

      // then
      expect(dataset).to.matchShape({
        property: {
          path: schema.datePublished,
          hasValue: $rdf.literal('2020-10-12', xsd.date),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('does not change dataset published date on revision>1', async () => {
      // given
      const resource = $rdf.clownface()
        .namedNode('job')
        .addOut(schema.actionStatus, schema.CompletedActionStatus)
        .addOut(dcterms.modified, $rdf.literal('2020-12-12T11:30:30', xsd.dateTime))
      job
        .addOut(cc.revision, 20)
      dataset.addOut(schema.datePublished, $rdf.literal('2020-10-12', xsd.date))

      // when
      await update({
        resource,
        store,
      })

      // then
      expect(dataset).to.matchShape({
        property: {
          path: schema.datePublished,
          hasValue: $rdf.literal('2020-10-12', xsd.date),
          minCount: 1,
          maxCount: 1,
        },
      })
    })
  })
})
