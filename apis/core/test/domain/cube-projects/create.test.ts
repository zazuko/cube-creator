import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import { dcat, rdf, rdfs, schema, sh, _void, hydra, xsd, dcterms } from '@tpluscode/rdf-ns-builders'
import { cc, cube, shape } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import '../../../lib/domain'
import env from '@cube-creator/core/env'

describe('domain/cube-projects/create', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = clownface({ dataset: $rdf.dataset() }).namedNode('projects')

  beforeEach(() => {
    store = new TestResourceStore([
      projectsCollection,
    ])
  })

  it('creates identifier by slugifying rdfs:label', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.label).to.eq('Foo bar project')
    expect(project.id.value).to.match(/\/cube-project\/foo-bar-project-(.+)$/)
    expect(project.creator).to.deep.eq(user)
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
    expect(project.csvMapping).to.be.undefined
  })

  it('initializes a void:Dataset resource', async function () {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    const dataset = await store.get(project.dataset)
    expect(dataset).to.matchShape({
      property: {
        path: rdf.type,
        [sh.hasValue.value]: [schema.Dataset, _void.Dataset, dcat.Dataset],
      },
    })
  })

  describe('CSV project', () => {
    it('creates a CSV Mapping resource', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.namespace, $rdf.namedNode('http://example.com'))
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.csvMapping).to.be.ok
    })

    it('initializes project links to child resources dataset and cube graph', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.namespace, $rdf.namedNode('http://example.com'))
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project).to.matchShape({
        property: [{
          path: cc.dataset,
          nodeKind: sh.IRI,
          pattern: '/dataset$',
          minCount: 1,
          maxCount: 1,
        }, {
          path: cc.cubeGraph,
          nodeKind: sh.IRI,
          pattern: '/cube-data$',
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('initializes a CsvMapping resource', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(cc.namespace, $rdf.namedNode('http://example.com'))
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })

      // then
      const csvMapping = await store.get(project.csvMapping?.id as NamedNode)
      expect(csvMapping).to.matchShape({
        property: [{
          path: cc.csvSourceCollection,
          nodeKind: sh.IRI,
          minCount: 1,
          maxCount: 1,
        }, {
          path: rdf.type,
          [sh.hasValue.value]: [cc.CsvMapping, hydra.Resource],
        }, {
          path: cc.tables,
          nodeKind: sh.IRI,
          minCount: 1,
          maxCount: 1,
        }, {
          path: cc.namespace,
          nodeKind: sh.IRI,
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('generates a mapping namespace if none was given', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })

      // then
      const csvMapping = await store.get(project.csvMapping?.id as NamedNode)
      expect(csvMapping).to.matchShape({
        property: [{
          path: cc.namespace,
          nodeKind: sh.IRI,
          minCount: 1,
          maxCount: 1,
          pattern: `^${env.API_CORE_BASE}cube/foo-bar-project-.+$`,
        }],
      })
    })

    it("adds cc:namespace value as dataset's cube", async function () {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(cc.namespace, $rdf.namedNode('http://example.com'))
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })

      // then
      const dataset = await store.get(project.dataset)
      expect(dataset).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: _void.Dataset,
        }, {
          path: schema.hasPart,
          hasValue: $rdf.namedNode('http://example.com'),
          node: {
            property: [{
              path: rdf.type,
              hasValue: cube.Cube,
            }, {
              path: schema.dateCreated,
              datatype: xsd.date,
              nodeKind: sh.Literal,
            }, {
              path: dcterms.creator,
              nodeKind: sh.IRI,
            }],
          },
        }],
      })
    })
  })
})
