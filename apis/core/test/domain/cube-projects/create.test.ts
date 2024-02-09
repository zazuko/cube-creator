import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { dcat, rdf, rdfs, schema, sh, _void, hydra, xsd, dcterms } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { Dataset } from '@cube-creator/model'
import '../../../lib/domain'
import { Project } from '@cube-creator/model/Project'
import { fromPointer } from '@cube-creator/model/Organization'
import sinon from 'sinon'
import { namedNode } from '@cube-creator/testing/clownface'
import { DomainError } from '@cube-creator/api-errors'
import * as orgQueries from '../../../lib/domain/organization/query'
import * as projectQueries from '../../../lib/domain/cube-projects/queries'
import { TestResourceStore } from '../../support/TestResourceStore'
import { createProject } from '../../../lib/domain/cube-projects/create'

describe('domain/cube-projects/create', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = namedNode('projects')
  let projectExists: sinon.SinonStub

  const organization = fromPointer(namedNode('org'), {
    publishGraph: $rdf.namedNode('http://example.com/published-cube'),
    namespace: $rdf.namedNode('http://example.com/'),
  })

  beforeEach(() => {
    store = new TestResourceStore([
      projectsCollection,
      organization,
    ])

    sinon.stub(orgQueries, 'findOrganization').resolves({
      organizationId: organization.id,
    })
    projectExists = sinon.stub(projectQueries, 'exists').resolves(false)
    sinon.stub(orgQueries, 'cubeNamespaceAllowed').resolves(true)
  })

  afterEach(() => {
    sinon.restore()
  })

  it('creates identifier by slugifying rdfs:label', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(dcterms.identifier, 'ubd/28')
      .addOut(schema.maintainer, organization.id)
      .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

    // when
    const { project } = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.label).to.eq('Foo bar project')
    expect(project.id.value).to.match(/\/cube-project\/foo-bar-project-(.+)$/)
    expect(project.creator.id).to.deep.eq(user)
  })

  describe('initializes a void:Dataset resource', () => {
    let project: Project

    beforeEach(async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(schema.maintainer, organization.id)
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

      // when
      ;({ project } = await createProject({ resource, store, projectsCollection, user }))
    })

    it('creates metadata placeholders', async () => {
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

    it('sets default creation dates', async () => {
      // then
      const dataset = await store.get(project.dataset.id)
      expect(dataset).to.matchShape({
        property: [{
          path: dcterms.issued,
          datatype: xsd.date,
          minCount: 1,
          maxCount: 1,
        }, {
          path: schema.dateCreated,
          [sh.equals.value]: dcterms.issued,
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('does not set cube identifier as metadata identifier', async () => {
      // then
      const dataset = await store.get(project.dataset.id)
      expect(dataset).to.matchShape({
        property: [{
          path: dcterms.identifier,
          maxCount: 0,
        }],
      })
    })
  })

  it('initializes a dimension metadata collection resource', async function () {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(dcterms.identifier, 'ubd/28')
      .addOut(schema.maintainer, organization.id)
      .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

    // when
    const { project } = await createProject({ resource, store, projectsCollection, user })

    // then
    const dataset = await store.getResource<Dataset>(project.dataset.id)
    const dimensionMetadata = await store.get(dataset?.dimensionMetadata.id)
    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [cc.DimensionMetadataCollection, hydra.Resource],
        minCount: 2,
        maxCount: 2,
      }],
    })
  })

  it('creates a job collection resource linked to itself', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(dcterms.identifier, 'ubd/28')
      .addOut(schema.maintainer, organization.id)
      .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

    // when
    const { project } = await createProject({ resource, store, projectsCollection, user })

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

  it('throws when another project uses same cube identifier', async () => {
    // given
    projectExists.resolves(true)
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(dcterms.identifier, 'ubd/28')
      .addOut(schema.maintainer, organization.id)
      .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

    // when
    const promise = createProject({ resource, store, projectsCollection, user })

    // then
    await expect(promise).eventually.rejectedWith(DomainError)
    expect(projectExists).to.have.been.calledWith('ubd/28', sinon.match(organization.id))
  })

  it('keeps the project source kind', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('')
      .addOut(rdfs.label, 'Foo bar project')
      .addOut(schema.maintainer, organization.id)
      .addOut(dcterms.identifier, 'ubd/28')
      .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

    // when
    const { project } = await createProject({ resource, store, projectsCollection, user })

    // then
    expect(project.sourceKind).to.deep.eq(cc['projectSourceKind/CSV'])
  })

  describe('CSV project', () => {
    it('creates a CSV Mapping resource', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(schema.maintainer, organization.id)
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.csvMapping).to.be.ok
    })

    it('initializes export link', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(schema.maintainer, organization.id)
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.export).to.be.ok
    })

    it('initializes project details link', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(schema.maintainer, organization.id)
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.details).to.be.ok
    })

    it('initializes project links to child resources dataset and cube graph', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(schema.maintainer, organization.id)
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(cc.publishGraph, $rdf.namedNode('http://example.com/published-cube'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

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
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

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
        }],
      })
    })

    it("generates dataset's cube id", async function () {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      const dataset = await store.get(project.dataset.id)
      expect(dataset).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: _void.Dataset,
        }, {
          path: schema.hasPart,
          hasValue: $rdf.namedNode('http://example.com/ubd/28'),
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
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })
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
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
        .addOut(dcterms.identifier, 'ubd/28')
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })
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

  describe('Existing cube', () => {
    it('does not create a CSV Mapping resource', async () => {
      // given
      const resource = await clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])
        .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://example.cube/'))
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.endpoint/'))
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.csvMapping).to.be.undefined
    })

    it('initializes export link', async () => {
      // given
      const resource = await clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Foo bar project')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])
        .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://example.cube/'))
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.endpoint/'))
        .addOut(schema.maintainer, organization.id)

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

      // then
      expect(project.export).to.be.ok
    })

    it('throws when cube URI is missing', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Import project')
        .addOut(schema.maintainer, organization.id)
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.endpoint/'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])

      // when
      const promise = createProject({ resource, store, projectsCollection, user })

      // then
      await expect(promise).to.be.eventually.rejected
    })

    it('throws when cube URI is string', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Import project')
        .addOut(schema.maintainer, organization.id)
        .addOut(cc['CubeProject/sourceCube'], $rdf.literal('http://example.cube/'))
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.endpoint/'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])

      // when
      const promise = createProject({ resource, store, projectsCollection, user })

      // then
      await expect(promise).to.be.eventually.rejected
    })

    it('throws when source endpoint is missing', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Import project')
        .addOut(schema.maintainer, organization.id)
        .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://example.cube/'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])

      // when
      const promise = createProject({ resource, store, projectsCollection, user })

      // then
      await expect(promise).to.be.eventually.rejected
    })

    it('initializes project links to child resources dataset and cube graph', async () => {
      // given
      const resource = clownface({ dataset: $rdf.dataset() })
        .namedNode('')
        .addOut(rdfs.label, 'Import project')
        .addOut(schema.maintainer, organization.id)
        .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://example.cube/'))
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.endpoint/'))
        .addOut(cc.publishGraph, $rdf.namedNode('http://example.com/published-cube'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])

      // when
      const { project } = await createProject({ resource, store, projectsCollection, user })

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
  })
})
