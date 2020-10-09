import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcterms, hydra, rdf, rdfs } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'

describe('domain/cube-projects/create', () => {
  let store: TestResourceStore
  const user = 'userId'

  beforeEach(() => {
    store = new TestResourceStore([])
  })

  it('creates identifier by slugifying rdfs:label', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, user })

    // then
    expect(project.out(rdfs.label).value).to.eq('Foo bar project')
    expect(project.term.value).to.match(/\/cube-project\/foo-bar-project-(.+)$/)
    expect(project.out(dcterms.creator).value).to.match(new RegExp(`/user/${user}$`))
  })

  it('creates resource with correct rdf types', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, user })

    // then
    expect(project.out(rdf.type).terms).to.deep.contain.members([
      hydra.Resource,
      cc.CubeProject,
    ])
  })

  it('does not create a CSV Mapping resource for existing cube source', async () => {
    // given
    const resource = await clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(cc.projectSourceKind, 'Existing Cube')

    // when
    const project = await createProject({ resource, store, user })

    // then
    expect(project.out(cc.csvMapping).term).to.be.undefined
  })

  it('creates a CSV Mapping when source kind is CSV', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(cc.projectSourceKind, 'CSV')

    // when
    const project = await createProject({ resource, store, user })

    // then
    expect(project.out(cc.csvMapping).term).to.be.ok
  })
})
