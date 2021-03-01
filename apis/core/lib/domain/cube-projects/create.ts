import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc, shape } from '@cube-creator/core/namespace'
import * as Project from '@cube-creator/model/Project'
import * as Dataset from '@cube-creator/model/Dataset'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { DomainError } from '@cube-creator/api-errors'

interface CreateProjectCommand {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  user: NamedNode
  userName: string
}

export async function createProject({
  projectsCollection,
  resource,
  store,
  user,
  userName,
}: CreateProjectCommand): Promise<Project.Project> {
  const label = resource.out(rdfs.label).value
  if (!label) {
    throw new Error('Missing project name')
  }
  const maintainer = resource.out(schema.maintainer).term
  if (!maintainer || maintainer.termType !== 'NamedNode') {
    throw new DomainError('Missing organization or not a named node')
  }
  const cubeIdentifier = resource.out(dcterms.identifier).value
  if (!cubeIdentifier) {
    throw new Error('Missing cube identifier name')
  }

  const project = Project.create(await store.createMember(projectsCollection.term, id.cubeProject(label)), {
    creator: { id: user, name: userName },
    label,
    maintainer,
    cubeIdentifier,
  })

  project.initializeJobCollection(store)
  const dataset = Dataset.create(store.create(project.dataset.id), {
    [dcterms.identifier.value]: project.cubeIdentifier,
  })

  DimensionMetadata.createCollection(store.create(dataset.dimensionMetadata.id))

  if (shape('cube-project/create#CSV').equals(resource.out(cc.projectSourceKind).term)) {
    project.initializeCsvMapping(store)
    const organization = await store.getResource(project.maintainer)
    dataset.addCube(organization.createIdentifier({
      cubeIdentifier,
    }), user)
  }

  return project
}
