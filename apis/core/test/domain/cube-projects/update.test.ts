import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { NamedNode } from 'rdf-js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import '../../../lib/domain'
import { CsvMapping } from '@cube-creator/model'
import { updateProject } from '../../../lib/domain/cube-projects/update'

describe('domain/cube-projects/update', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = clownface({ dataset: $rdf.dataset() }).namedNode('projects')
  let project: GraphPointer<NamedNode, DatasetExt>

  function projectPointer(id: ResourceIdentifier = $rdf.namedNode('')) {
    return clownface({ dataset: $rdf.dataset() })
      .node(id)
      .addOut(rdfs.label, 'Created name')
      .addOut(cc.namespace, $rdf.namedNode('http://created.namespace/'))
      .addOut(cc.publishGraph, $rdf.namedNode('http://published.cubes/'))
      .addOut(cc.projectSourceKind, shape('cube-project/create#CSV'))
  }

  beforeEach(async () => {
    store = new TestResourceStore([
      projectsCollection,
    ])

    const resource = projectPointer()

    project = (await createProject({ resource, store, projectsCollection, user })).pointer as any
  })

  describe('CSV project', () => {
    it('updates publishGraph', async () => {
      const resource = projectPointer(project.term)
      resource
        .deleteOut(cc.publishGraph)
        .addOut(cc.publishGraph, $rdf.namedNode('http://published.cubes/changed'))
        .addOut(cc.csvMapping, mapping => {
          mapping.addOut(cc.namespace, $rdf.namedNode('http://created.namespace/'))
        })

      const editedProject = await updateProject({
        resource,
        project,
        store,
      })

      expect(editedProject).to.matchShape({
        property: {
          path: cc.publishGraph,
          hasValue: $rdf.namedNode('http://published.cubes/changed'),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('edits a CSV Mapping resource', async () => {
      const resource = projectPointer(project.term)
        .deleteOut(rdfs.label)
        .addOut(rdfs.label, 'Edited name')
        .addOut(cc.csvMapping, mapping => {
          mapping.addOut(cc.namespace, $rdf.namedNode('http://edited.namespace/'))
        })

      const editedProject = await updateProject({
        resource,
        project,
        store,
      })

      expect(editedProject.pointer.out(rdfs.label).term?.value).to.eq('Edited name')

      const namespace = await store.getResource<CsvMapping>(editedProject.pointer.out(cc.csvMapping).term)
      expect(namespace?.pointer.out(cc.namespace).term?.value).to.eq('http://edited.namespace/')
    })

    it('does not touch cube if namespace does not change', async () => {
      // given
      const resource = projectPointer(project.term)
        .addOut(cc.csvMapping, mapping => {
          mapping.addOut(cc.namespace, $rdf.namedNode('http://created.namespace/'))
        })
      const datasetBefore = (await store.get(project.out(cc.dataset).term)).dataset.toCanonical()

      // when
      const editedProject = await updateProject({
        resource,
        project,
        store,
      })

      // then
      const datasetAfter = (await store.get(editedProject.dataset.id)).dataset.toCanonical()
      expect(datasetAfter).to.eq(datasetBefore)
    })

    it('renames cube if namespace changes', async () => {
      // given
      const datasetBefore = await store.get(project.out(cc.dataset).term)
      datasetBefore.out(schema.hasPart)
        .addOut(rdfs.label, 'Cube')
      const namespace = $rdf.namedNode('http://edited.namespace/')
      const resource = projectPointer(project.term)
        .addOut(cc.csvMapping, mapping => {
          mapping.addOut(cc.namespace, namespace)
        })

      // when
      const editedProject = await updateProject({
        resource,
        project,
        store,
      })

      // then
      const datasetAfter = await store.get(editedProject.dataset.id)
      expect(datasetAfter).to.matchShape({
        property: {
          path: schema.hasPart,
          minCount: 1,
          hasValue: namespace,
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
  })
})
