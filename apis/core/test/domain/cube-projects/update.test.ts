import { describe, it, beforeEach, afterEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { DomainError } from '@cube-creator/api-errors'
import * as sinon from 'sinon'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { NamedNode } from 'rdf-js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import '../../../lib/domain'
import { Dataset, Project } from '@cube-creator/model'
import { fromPointer } from '@cube-creator/model/Organization'
import { updateProject } from '../../../lib/domain/cube-projects/update'
import * as projectQueries from '../../../lib/domain/cube-projects/queries'

describe('domain/cube-projects/update', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const userName = 'User Name'
  const projectsCollection = clownface({ dataset: $rdf.dataset() }).namedNode('projects')
  let projectExists: sinon.SinonStub

  const bafu = fromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('bafu'), {
    namespace: $rdf.namedNode('http://bafu.namespace/'),
    publishGraph: $rdf.namedNode('http://bafu.cubes/'),
  })
  const bar = fromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('bar'), {
    namespace: $rdf.namedNode('http://bar.namespace/'),
    publishGraph: $rdf.namedNode('http://bar.cubes/'),
  })
  let project: GraphPointer<NamedNode, DatasetExt>

  beforeEach(async () => {
    store = new TestResourceStore([
      projectsCollection,
      bafu,
      bar,
    ])
    projectExists = sinon.stub(projectQueries, 'exists').resolves(false)
  })

  afterEach(sinon.restore)

  describe('CSV project', () => {
    function projectPointer(id: ResourceIdentifier = $rdf.namedNode('')) {
      return clownface({ dataset: $rdf.dataset() })
        .node(id)
        .addOut(rdfs.label, 'Created name')
        .addOut(schema.maintainer, bafu.id)
        .addOut(dcterms.identifier, 'cube')
        .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))
    }

    beforeEach(async () => {
      const resource = projectPointer()
      project = (await createProject({ resource, store, projectsCollection, user, userName })).pointer as any

      const datasetBefore = await store.get(project.out(cc.dataset).term)
      datasetBefore.out(schema.hasPart)
        .addOut(rdfs.label, 'Cube')

      const dataset = await store.getResource<Dataset>(project.out(cc.dataset).term)
      const metadataBefore = await store.get(dataset?.dimensionMetadata.id)
      metadataBefore.addOut(schema.hasPart, dimension => {
        dimension
          .addOut(schema.about, $rdf.namedNode('http://bafu.namespace/cube/year'))
          .addOut(rdfs.label, $rdf.literal('Jahr', 'de'))
      })
    })

    it('updates name', async () => {
      // given
      const resource = projectPointer(project.term)
      resource
        .deleteOut(rdfs.label)
        .addOut(rdfs.label, 'Edited name')

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      expect(editedProject.pointer.out(rdfs.label).term?.value).to.eq('Edited name')
    })

    describe('when maintainer changes', () => {
      let editedProject: Project

      beforeEach(async () => {
        const resource = projectPointer(project.term)
        resource
          .deleteOut(schema.maintainer)
          .addOut(schema.maintainer, bar.id)

        editedProject = await updateProject({
          resource,
          store,
        })
      })

      it('updates project resource', () => {
        expect(editedProject).to.matchShape({
          property: {
            path: schema.maintainer,
            hasValue: bar.id,
            minCount: 1,
            maxCount: 1,
          },
        })
      })

      it('renames cube', async () => {
        const datasetAfter = await store.get(editedProject.dataset.id)
        expect(datasetAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            minCount: 1,
            hasValue: $rdf.namedNode('http://bar.namespace/cube'),
            node: {
              property: {
                path: rdfs.label,
                hasValue: $rdf.literal('Cube'),
                minCount: 1,
                maxCount: 1,
              },
            },
          },
        })
      })

      it('rebases metadata properties', async () => {
        const dataset = await store.getResource<Dataset>(editedProject.pointer.out(cc.dataset).term)
        const metadataAfter = await store.get(dataset?.dimensionMetadata.id)

        expect(metadataAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            node: {
              property: [{
                path: schema.about,
                hasValue: $rdf.namedNode('http://bar.namespace/cube/year'),
              }, {
                path: rdfs.label,
                hasValue: $rdf.literal('Jahr', 'de'),
              }],
            },
          },
        })
      })
    })

    describe('when cube identifier changes', function () {
      let editedProject: Project

      beforeEach(async () => {
        const resource = projectPointer(project.term)
        resource
          .deleteOut(dcterms.identifier)
          .addOut(dcterms.identifier, 'new/cube')

        editedProject = await updateProject({
          resource,
          store,
        })
      })

      it('updates project resource', async () => {
        expect(editedProject.pointer.out(dcterms.identifier).value).to.eq('new/cube')
      })

      it('renames cube', async () => {
        const datasetAfter = await store.get(editedProject.dataset.id)
        expect(datasetAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            minCount: 1,
            hasValue: $rdf.namedNode('http://bafu.namespace/new/cube'),
            node: {
              property: {
                path: rdfs.label,
                hasValue: $rdf.literal('Cube'),
                minCount: 1,
                maxCount: 1,
              },
            },
          },
        })
      })

      it('rebases metadata properties', async () => {
        const dataset = await store.getResource<Dataset>(editedProject.pointer.out(cc.dataset).term)
        const metadataAfter = await store.get(dataset?.dimensionMetadata.id)

        expect(metadataAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            node: {
              property: [{
                path: schema.about,
                hasValue: $rdf.namedNode('http://bafu.namespace/new/cube/year'),
              }, {
                path: rdfs.label,
                hasValue: $rdf.literal('Jahr', 'de'),
              }],
            },
          },
        })
      })
    })

    it('does not touch cube if nothing changes', async () => {
      // given
      const resource = projectPointer(project.term)
      const datasetBefore = $rdf.dataset([...(await store.get(project.out(cc.dataset).term)).dataset]).toCanonical()

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      const datasetAfter = $rdf.dataset([...(await store.get(editedProject.dataset.id)).dataset]).toCanonical()
      expect(datasetAfter).to.eq(datasetBefore)
    })

    it('does not touch cube metadata if nothing changes', async () => {
      // given
      const resource = projectPointer(project.term)
      const dataset = await store.getResource<Dataset>(project.out(cc.dataset).term)
      const metadataBefore = await store.get(dataset?.dimensionMetadata.id)

      // when
      await updateProject({
        resource,
        store,
      })

      // then
      const metadataAfter = $rdf.dataset([...(await store.get(dataset?.dimensionMetadata.id)).dataset]).toCanonical()
      expect(metadataAfter).to.eq($rdf.dataset([...metadataBefore.dataset]).toCanonical())
    })

    it('throws when another project uses same cube identifier', async () => {
      // given
      projectExists.resolves(true)
      const resource = projectPointer(project.term)
      resource
        .deleteOut(dcterms.identifier)
        .addOut(dcterms.identifier, 'new/cube')

      // when
      const promise = createProject({ resource, store, projectsCollection, user, userName })

      // then
      await expect(promise).eventually.rejectedWith(DomainError)
      expect(projectExists).to.have.been.calledWith('new/cube', sinon.match(bafu.id))
    })

    it('throws when another project uses same cube identifier is changed organization', async () => {
      // given
      projectExists.resolves(true)
      const resource = projectPointer(project.term)
      resource
        .deleteOut(schema.maintainer)
        .addOut(schema.maintainer, bar.id)

      // when
      const promise = createProject({ resource, store, projectsCollection, user, userName })

      // then
      await expect(promise).eventually.rejectedWith(DomainError)
      expect(projectExists).to.have.been.calledWith('cube', sinon.match(bar.id))
    })
  })

  describe('Import project', () => {
    function projectPointer(id: ResourceIdentifier = $rdf.namedNode('')) {
      return clownface({ dataset: $rdf.dataset() })
        .node(id)
        .addOut(rdfs.label, 'Created name')
        .addOut(schema.maintainer, bafu.id)
        .addOut(cc['CubeProject/importCube'], $rdf.namedNode('http://external.cube'))
        .addOut(cc['CubeProject/importFromEndpoint'], $rdf.namedNode('http://external.cube/query'))
        .addOut(cc.projectSourceKind, shape('cube-project/create#ExistingCube'))
    }

    beforeEach(async () => {
      const resource = projectPointer()
      project = (await createProject({ resource, store, projectsCollection, user, userName })).pointer as any

      const datasetBefore = await store.get(project.out(cc.dataset).term)
      datasetBefore.out(schema.hasPart)
        .addOut(rdfs.label, 'Cube')

      const dataset = await store.getResource<Dataset>(project.out(cc.dataset).term)
      const metadataBefore = await store.get(dataset?.dimensionMetadata.id)
      metadataBefore.addOut(schema.hasPart, dimension => {
        dimension
          .addOut(schema.about, $rdf.namedNode('http://external.cube/dimension/year'))
          .addOut(rdfs.label, $rdf.literal('Jahr', 'de'))
      })
    })

    it('updates importFromGraph', async () => {
      // given
      const resource = projectPointer(project.term)
      resource
        .deleteOut(cc['CubeProject/importFromGraph'])
        .addOut(cc['CubeProject/importFromGraph'], $rdf.namedNode('http://example.com/cube-graph'))

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      expect(editedProject.pointer.out(cc['CubeProject/importFromGraph']).term)
        .to.deep.eq($rdf.namedNode('http://example.com/cube-graph'))
    })

    it('updates importFromEndpoint', async () => {
      // given
      const resource = projectPointer(project.term)
      resource
        .deleteOut(cc['CubeProject/importFromEndpoint'])
        .addOut(cc['CubeProject/importFromEndpoint'], $rdf.namedNode('http://example.com/sparql'))

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      expect(editedProject.pointer.out(cc['CubeProject/importFromEndpoint']).term)
        .to.deep.eq($rdf.namedNode('http://example.com/sparql'))
    })

    describe('when cube identifier changes', function () {
      let editedProject: Project

      beforeEach(async () => {
        const resource = projectPointer(project.term)
        resource
          .deleteOut(cc['CubeProject/importCube'])
          .addOut(cc['CubeProject/importCube'], $rdf.namedNode('http://external.cube/new'))

        editedProject = await updateProject({
          resource,
          store,
        })
      })

      it('updates project resource', async () => {
        expect(editedProject.pointer.out(cc['CubeProject/importCube']).term)
          .to.deep.eq($rdf.namedNode('http://external.cube/new'))
      })

      it('renames cube', async () => {
        const datasetAfter = await store.get(editedProject.dataset.id)
        expect(datasetAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            minCount: 1,
            hasValue: $rdf.namedNode('http://external.cube/new'),
            node: {
              property: {
                path: rdfs.label,
                hasValue: $rdf.literal('Cube'),
                minCount: 1,
                maxCount: 1,
              },
            },
          },
        })
      })

      it('rebases metadata properties', async () => {
        const dataset = await store.getResource<Dataset>(editedProject.pointer.out(cc.dataset).term)
        const metadataAfter = await store.get(dataset?.dimensionMetadata.id)

        expect(metadataAfter).to.matchShape({
          property: {
            path: schema.hasPart,
            node: {
              property: [{
                path: schema.about,
                hasValue: $rdf.namedNode('http://external.cube/new/dimension/year'),
              }, {
                path: rdfs.label,
                hasValue: $rdf.literal('Jahr', 'de'),
              }],
            },
          },
        })
      })
    })
  })
})
