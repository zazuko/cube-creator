import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Project from '@cube-creator/model/Project'
import * as Dataset from '@cube-creator/model/Dataset'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { DomainError } from '@cube-creator/api-errors'
import { exists } from './queries'
import { cubeNamespaceAllowed } from '../organization/query'
import error from 'http-errors'
import { createImportJob } from '../job/create'

interface CreateProjectCommand {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  user: NamedNode
  userName: string
}

interface CreateProjectResource extends Omit<CreateProjectCommand, 'projectsCollection'> {
  label: string
  maintainer: NamedNode
  projectNode: GraphPointer<NamedNode>
}

async function createCsvProjectResource({ user, userName, projectNode, store, label, maintainer, resource }: CreateProjectResource) {
  const cubeIdentifier = resource.out(dcterms.identifier).value
  if (!cubeIdentifier) {
    throw new Error('Missing cube identifier name')
  }

  const sourceKind = resource.out(cc.projectSourceKind).term
  if (sourceKind?.termType !== 'NamedNode') {
    throw new Error('Invalid source kind')
  }

  if (await exists(cubeIdentifier, maintainer)) {
    throw new DomainError('Another project is already using same identifier')
  }

  const project = Project.createCsvProject(projectNode, {
    creator: { id: user, name: userName },
    label,
    maintainer,
    cubeIdentifier,
    sourceKind,
  })

  const dataset = Dataset.create(store.create(project.dataset.id), {
    [dcterms.identifier.value]: project.cubeIdentifier,
  })

  project.initializeCsvMapping(store)
  const organization = await store.getResource(project.maintainer)
  dataset.addCube(organization.createIdentifier({
    cubeIdentifier,
  }), user)

  return { project, dataset }
}

async function createImportProjectResources({ resource, user, userName, projectNode, store, label, maintainer }: CreateProjectResource) {
  const sourceCube = resource.out(cc['CubeProject/sourceCube']).term
  if (sourceCube?.termType !== 'NamedNode') {
    throw new Error('Missing cube identifier')
  }
  const sourceEndpoint = resource.out(cc['CubeProject/sourceEndpoint']).term
  if (sourceEndpoint?.termType !== 'NamedNode') {
    throw new Error('Missing source endpoint')
  }
  const sourceGraph = resource.out(cc['CubeProject/sourceGraph']).term
  if (sourceGraph && sourceGraph.termType !== 'NamedNode') {
    throw new Error('Source graph must be a named node')
  }

  const sourceKind = resource.out(cc.projectSourceKind).term
  if (sourceKind?.termType !== 'NamedNode') {
    throw new Error('Invalid source kind')
  }

  if (await exists(sourceCube, maintainer)) {
    throw new DomainError('Another project already produces a cube with that URI')
  }

  if (await cubeNamespaceAllowed(sourceCube, maintainer) === false) {
    throw new DomainError("Imported cube does not match the Organisation's base URI")
  }

  const project = Project.createImportProject(projectNode, {
    creator: { id: user, name: userName },
    label,
    maintainer,
    sourceCube,
    sourceEndpoint,
    sourceGraph,
    sourceKind,
  })

  const dataset = Dataset.create(store.create(project.dataset.id), {
    [dcterms.identifier.value]: project.sourceCube,
  })
  dataset.addCube(project.sourceCube, user)

  return { project, dataset }
}

interface CreatedProject {
  project: Project.Project
  job?: GraphPointer<NamedNode>
}

export async function createProject({
  projectsCollection,
  resource,
  store,
  user,
  userName,
}: CreateProjectCommand): Promise<CreatedProject> {
  const label = resource.out(rdfs.label).value
  if (!label) {
    throw new Error('Missing project name')
  }
  const maintainer = resource.out(schema.maintainer).term
  if (!maintainer || maintainer.termType !== 'NamedNode') {
    throw new DomainError('Missing organization or not a named node')
  }

  let project: Project.Project
  let dataset: Dataset.Dataset

  const projectNode = await store.createMember(projectsCollection.term, id.cubeProject(label))

  const isCsvProject = cc['projectSourceKind/CSV'].equals(resource.out(cc.projectSourceKind).term)
  const isImportProject = cc['projectSourceKind/ExistingCube'].equals(resource.out(cc.projectSourceKind).term)

  if (isCsvProject) {
    ({ project, dataset } = await createCsvProjectResource({
      user,
      userName,
      projectNode,
      store,
      label,
      maintainer,
      resource,
    }))
  } else if (isImportProject) {
    ({ project, dataset } = await createImportProjectResources({
      user,
      userName,
      projectNode,
      store,
      resource,
      label,
      maintainer,
    }))
  } else {
    throw new error.BadRequest(`Unexpected value of ${cc.projectSourceKind.value}`)
  }

  project.initializeJobCollection(store)
  DimensionMetadata.createCollection(store.create(dataset.dimensionMetadata.id))

  if (isImportProject) {
    const job = await createImportJob({
      store,
      resource: project.jobCollection.id,
    })
    return { project, job }
  }

  return { project }
}
