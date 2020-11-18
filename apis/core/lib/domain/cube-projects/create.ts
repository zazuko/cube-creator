import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import * as Project from '@cube-creator/model/Project'
import * as Dataset from '@cube-creator/model/Dataset'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'

interface CreateProjectCommand {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore
  user: NamedNode
}

export async function createProject({
  projectsCollection,
  resource,
  store = resourceStore(),
  user,
}: CreateProjectCommand): Promise<Project.Project> {
  const label = resource.out(rdfs.label).value
  if (!label) {
    throw new Error('Missing project name')
  }

  const project = Project.create(await store.createMember(projectsCollection.term, id.cubeProject(label)), {
    creator: user,
    label,
  })

  project.initializeJobCollection(store)
  const dataset = Dataset.create(store.create(project.dataset.id))

  DimensionMetadata.createCollection(store.create(dataset.dimensionMetadata.id))

  if (shape('cube-project/create#CSV').equals(resource.out(cc.projectSourceKind).term)) {
    let namespace = resource.out(cc.namespace).term
    if (!namespace || namespace.termType !== 'NamedNode') {
      namespace = id.cube(project)
    }

    const csvMapping = project.initializeCsvMapping(store, namespace)
    dataset.addCube(csvMapping.namespace, user)
  }

  await store.save()
  return project
}
