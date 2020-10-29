import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import * as Project from '@cube-creator/model/Project'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'

interface CreateProjectCommand {
  projectsCollection: NamedNode
  resource: GraphPointer
  store?: ResourceStore
  user: NamedNode
}

export async function createProject({
  projectsCollection,
  resource,
  store = resourceStore(),
  user,
}: CreateProjectCommand): Promise<GraphPointer> {
  const label = resource.out(rdfs.label).value!

  const project = Project.create(await store.createMember(projectsCollection, id.cubeProject(label)), {
    creator: user,
    label,
  })

  if (shape('cube-project/create#CSV').equals(resource.out(cc.projectSourceKind).term)) {
    project.initializeCsvMapping(store)
  }

  await store.save()
  return project.pointer
}
