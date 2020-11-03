import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { TestResourceStore } from '../../support/TestResourceStore'
import { update } from '../../../lib/domain/job/update'
import '../../../lib/domain'

describe('domain/job/update', () => {
  let job: GraphPointer<NamedNode, DatasetExt>
  let store: TestResourceStore

  beforeEach(() => {
    job = clownface({ dataset: $rdf.dataset() })
      .namedNode('job')
      .addOut(rdf.type, cc.Job)

    store = new TestResourceStore([
      job,
    ])
  })

  it('updates status', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
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
    const resource = clownface({ dataset: $rdf.dataset() })
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
})
