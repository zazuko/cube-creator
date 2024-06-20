import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { DomainError } from '@cube-creator/api-errors'
import sinon from 'sinon'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { dcterms, prov, rdfs, schema, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { namedNode } from '@cube-creator/testing/clownface'
import { Dataset, Project } from '@cube-creator/model'
import esmock from 'esmock'
import { createProject } from '../../../lib/domain/cube-projects/create.js'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import '../../../lib/domain/index.js'

describe('domain/cube-projects/update', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = $rdf.clownface().namedNode('projects')
  let projectExists: sinon.SinonStub
  let previouslyPublished: sinon.SinonStub

  let updateProject: typeof import('../../../lib/domain/cube-projects/update').updateProject

  const bafu = $rdf.rdfine.cc.Organization($rdf.clownface().namedNode('bafu'), {
    namespace: $rdf.namedNode('http://bafu.namespace/'),
    publishGraph: $rdf.namedNode('http://bafu.cubes/'),
  })
  const bar = $rdf.rdfine.cc.Organization($rdf.clownface().namedNode('bar'), {
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

    projectExists = sinon.stub().resolves(false)
    previouslyPublished = sinon.stub().resolves(false)
    ;({ updateProject } = await esmock('../../../lib/domain/cube-projects/update.js', {
      '../../../lib/domain/cube-projects/queries.js': {
        exists: projectExists,
        previouslyPublished,
      },
      '../../../lib/domain/organization/query.js': {
        cubeNamespaceAllowed: sinon.stub().resolves(true),
      },
    }))
  })

  describe('CSV project', () => {
    function projectPointer(id: ResourceIdentifier = $rdf.namedNode('')) {
      return $rdf.clownface()
        .node(id)
        .addOut(rdfs.label, 'Created name')
        .addOut(schema.maintainer, bafu.id)
        .addOut(dcterms.identifier, 'cube')
        .addOut(cc.projectSourceKind, cc['projectSourceKind/CSV'])
    }

    beforeEach(async () => {
      const resource = projectPointer()
      project = (await createProject({ resource, store, projectsCollection, user })).project.pointer as any

      const datasetBefore = await store.get(project.out(cc.dataset).term)
      datasetBefore.out(schema.hasPart)
        .addOut(rdfs.label, 'Cube')

      const yearDimension = $rdf.namedNode('http://bafu.namespace/cube/year')

      const dimensionMapping = namedNode('year-mapping')
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, yearDimension)
      store.push(dimensionMapping)

      const dataset = await store.getResource<Dataset>(project.out(cc.dataset).term)
      const metadataBefore = await store.get(dataset?.dimensionMetadata.id)
      metadataBefore.addOut(schema.hasPart, dimension => {
        dimension
          .addOut(schema.about, yearDimension)
          .addOut(rdfs.label, $rdf.literal('Jahr', 'de'))
          .addOut(cc.dimensionMapping, dimensionMapping)
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

      it('rebases schema:about of dimension mappings', async () => {
        const mappingAfter = await store.get('year-mapping')

        expect(mappingAfter).to.matchShape({
          property: {
            path: schema.about,
            hasValue: $rdf.namedNode('http://bar.namespace/cube/year'),
          },
        })
      })
    })

    describe('when project has already been published', () => {
      beforeEach(() => {
        previouslyPublished.resolves(true)
      })

      it('throws when maintainer changes', async () => {
        // then
        const resource = projectPointer(project.term)
        resource
          .deleteOut(schema.maintainer)
          .addOut(schema.maintainer, bar.id)

        // when
        const update = updateProject({
          resource,
          store,
        })

        // then
        await expect(update).to.have.rejected
      })

      it('throws when id changes', async () => {
        // then
        const resource = projectPointer(project.term)
        resource
          .deleteOut(dcterms.identifier)
          .addOut(dcterms.identifier, 'new/cube')

        // when
        const update = updateProject({
          resource,
          store,
        })

        // then
        await expect(update).to.have.rejected
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

      it('rebases schema:about of dimension mappings', async () => {
        const mappingAfter = await store.get('year-mapping')

        expect(mappingAfter).to.matchShape({
          property: {
            path: schema.about,
            hasValue: $rdf.namedNode('http://bafu.namespace/new/cube/year'),
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
      const promise = createProject({ resource, store, projectsCollection, user })

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
      const promise = createProject({ resource, store, projectsCollection, user })

      // then
      await expect(promise).eventually.rejectedWith(DomainError)
      expect(projectExists).to.have.been.calledWith('cube', sinon.match(bar.id))
    })
  })

  describe('Import project', () => {
    function projectPointer(id: ResourceIdentifier = $rdf.namedNode('')) {
      return $rdf.clownface()
        .node(id)
        .addOut(rdfs.label, 'Created name')
        .addOut(schema.maintainer, bafu.id)
        .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://external.cube'))
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://external.cube/query'))
        .addOut(cc.projectSourceKind, cc['projectSourceKind/ExistingCube'])
    }

    beforeEach(async () => {
      const resource = projectPointer()
      project = (await createProject({ resource, store, projectsCollection, user })).project.pointer as any

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

    it('updates sourceGraph', async () => {
      // given
      const resource = projectPointer(project.term)
      resource
        .deleteOut(cc['CubeProject/sourceGraph'])
        .addOut(cc['CubeProject/sourceGraph'], $rdf.namedNode('http://example.com/cube-graph'))

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      expect(editedProject.pointer.out(cc['CubeProject/sourceGraph']).term)
        .to.deep.eq($rdf.namedNode('http://example.com/cube-graph'))
    })

    it('updates sourceEndpoint', async () => {
      // given
      const resource = projectPointer(project.term)
      resource
        .deleteOut(cc['CubeProject/sourceEndpoint'])
        .addOut(cc['CubeProject/sourceEndpoint'], $rdf.namedNode('http://example.com/sparql'))

      // when
      const editedProject = await updateProject({
        resource,
        store,
      })

      // then
      expect(editedProject.pointer.out(cc['CubeProject/sourceEndpoint']).term)
        .to.deep.eq($rdf.namedNode('http://example.com/sparql'))
    })

    describe('when cube identifier changes', function () {
      let editedProject: Project

      beforeEach(async () => {
        const resource = projectPointer(project.term)
        resource
          .deleteOut(cc['CubeProject/sourceCube'])
          .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://external.cube/new'))

        editedProject = await updateProject({
          resource,
          store,
        })
      })

      it('updates project resource', async () => {
        expect(editedProject.pointer.out(cc['CubeProject/sourceCube']).term)
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

    describe('when project has already been published', () => {
      beforeEach(() => {
        previouslyPublished.resolves(true)
      })

      it('throws when id changes', async () => {
        // then
        const resource = projectPointer(project.term)
        resource
          .deleteOut(cc['CubeProject/sourceCube'])
          .addOut(cc['CubeProject/sourceCube'], $rdf.namedNode('http://external.cube/new'))

        // when
        const update = updateProject({
          resource,
          store,
        })

        // then
        await expect(update).to.have.rejected
      })
    })
  })
})
