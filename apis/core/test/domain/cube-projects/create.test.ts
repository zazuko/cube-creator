import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcterms, rdfs } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'

describe('domain/cube-projects/create', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = $rdf.namedNode('projects')

  beforeEach(() => {
    store = new TestResourceStore([])
  })

  it('creates identifier by slugifying rdfs:label', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.out(rdfs.label).value).to.eq('Foo bar project')
    expect(project.term.value).to.match(/\/cube-project\/foo-bar-project-(.+)$/)
    expect(project.out(dcterms.creator).term).to.deep.eq(user)
  })

  it('does not create a CSV Mapping resource for existing cube source', async () => {
    // given
    const resource = await clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(cc.projectSourceKind, 'Existing Cube')

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.out(cc.csvMapping).term).to.be.undefined
  })

  it('creates a CSV Mapping when source kind is CSV', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.out(cc.csvMapping).term).to.be.ok
  })
})
