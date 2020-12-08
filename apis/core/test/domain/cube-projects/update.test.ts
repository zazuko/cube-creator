import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import { createProject } from '../../../lib/domain/cube-projects/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import '../../../lib/domain'
import { CsvMapping, Project } from '@cube-creator/model'
import { updateProject } from '../../../lib/domain/cube-projects/update'

describe('domain/cube-projects/update', () => {
  let store: TestResourceStore
  const user = $rdf.namedNode('userId')
  const projectsCollection = clownface({ dataset: $rdf.dataset() }).namedNode('projects')
  let project: Project

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

    project = await createProject({ resource, store, projectsCollection, user })
  })

  describe('CSV project', () => {
    it('updates publishGraph', async () => {
      const resource = projectPointer(project.id)
      resource
        .deleteOut(cc.publishGraph)
        .addOut(cc.publishGraph, $rdf.namedNode('http://published.cubes/changed'))

      const editedProject = await updateProject({
        resource,
        project: project.pointer as GraphPointer<NamedNode>,
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
      project.pointer.deleteOut(rdfs.label)
      project.pointer.addOut(rdfs.label, 'Edited name')
      project.pointer.out(cc.csvMapping).deleteOut(cc.namespace)
      project.pointer.out(cc.csvMapping).addOut(cc.namespace, $rdf.namedNode('http://edited.namespace/'))

      const editedProject = await updateProject({
        resource: project.pointer,
        project: project.pointer as GraphPointer<NamedNode>,
        store,
      })

      expect(editedProject.pointer.out(rdfs.label).term?.value).to.eq('Edited name')

      const namespace = await store.getResource<CsvMapping>(editedProject.pointer.out(cc.csvMapping).term)
      expect(namespace?.pointer.out(cc.namespace).term?.value).to.eq('http://edited.namespace/')
    })
  })
})
