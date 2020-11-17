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
    const dataset = await store.get(project.dataset.id)
    expect(dataset).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [schema.Dataset, _void.Dataset, dcat.Dataset],
      }, {
        path: cc.dimensionMetadata,
        minCount: 1,
      }],
    })
  })

  it('creates a job collection resource linked to itself', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')

    // when
    const project = await createProject({ resource, store, projectsCollection, user })

    // then
    const jobs = await store.get(project.jobCollection.id)
    expect(project.jobCollection.id.value).to.match(/project\/.+\/jobs$/)
    expect(jobs).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [hydra.Collection, cc.JobCollection],
        minCount: 2,
      }, {
        path: hydra.manages,
        node: {
          xone: [{
            property: [{
              path: hydra.object,
              hasValue: cc.Job,
              minCount: 1,
            }, {
              path: hydra.property,
              hasValue: rdf.type,
              minCount: 1,
            }],
          }, {
            property: [{
              path: hydra.object,
              hasValue: project.id,
              minCount: 1,
            }, {
              path: hydra.property,
              hasValue: cc.project,
              minCount: 1,
            }],
          }],
        },
      }],
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
      const dataset = await store.get(project.dataset.id)
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

    it('creates a properly defined sources collection', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })
      const mapping = await store.get(project.csvMapping?.id as NamedNode)
      const sourceCollection = await store.get(mapping?.out(cc.csvSourceCollection).term as NamedNode)

      // then
      expect(sourceCollection).to.matchShape({
        property: {
          path: hydra.manages,
          xone: [{
            node: {
              property: [{
                path: hydra.property,
                hasValue: rdf.type,
                minCount: 1,
              }, {
                path: hydra.object,
                hasValue: cc.CSVSource,
                minCount: 1,
              }],
            },
          }, {
            node: {
              property: [{
                path: hydra.property,
                hasValue: cc.csvMapping,
                minCount: 1,
              }, {
                path: hydra.object,
                hasValue: mapping!.term,
                minCount: 1,
              }],
            },
          }],
        },
      })
    })

    it('creates a properly defined tables collection', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))

      // when
      const project = await createProject({ resource, store, projectsCollection, user })
      const mapping = await store.get(project.csvMapping?.id as NamedNode)
      const tableCollection = await store.get(mapping?.out(cc.tables).term as NamedNode)

      // then
      expect(tableCollection).to.matchShape({
        property: {
          path: hydra.manages,
          xone: [{
            node: {
              property: [{
                path: hydra.property,
                hasValue: rdf.type,
                minCount: 1,
              }, {
                path: hydra.object,
                hasValue: cc.Table,
                minCount: 1,
              }],
            },
          }, {
            node: {
              property: [{
                path: hydra.property,
                hasValue: cc.csvMapping,
                minCount: 1,
              }, {
                path: hydra.object,
                hasValue: mapping!.term,
                minCount: 1,
              }],
            },
          }],
        },
      })
    })
  })
})
