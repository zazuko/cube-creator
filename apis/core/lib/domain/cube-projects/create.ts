import type { NamedNode } from '@rdfjs/types'
import { GraphPointer } from 'clownface'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Project from '@cube-creator/model/Project'
import * as Dataset from '@cube-creator/model/Dataset'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { DomainError } from '@cube-creator/api-errors'
import error from 'http-errors'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { cubeNamespaceAllowed } from '../organization/query'
import { createImportJob } from '../job/create'
import { exists } from './queries'

interface CreateProjectCommand {
  projectsCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  user: NamedNode
}

interface CreateProjectResource extends Omit<CreateProjectCommand, 'projectsCollection'> {
  label: string
  maintainer: NamedNode
  isHiddenCube: boolean
  projectNode: GraphPointer<NamedNode>
}

async function createCsvProjectResource({ user, projectNode, store, label, maintainer, isHiddenCube, resource }: CreateProjectResource) {
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
    creator: user,
    label,
    maintainer,
    isHiddenCube,
    cubeIdentifier,
    sourceKind,
  })

  const dataset = Dataset.create(store.create(project.dataset.id))

  project.initializeCsvMapping(store)
  const organization = await store.getResource(project.maintainer)
  dataset.addCube(organization.createIdentifier({
    cubeIdentifier,
  }), user)

  return { project, dataset }
}

async function createImportProjectResources({ resource, user, projectNode, store, label, maintainer, isHiddenCube }: CreateProjectResource) {
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
    creator: user,
    label,
    maintainer,
    isHiddenCube,
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
}: CreateProjectCommand): Promise<CreatedProject> {
  const label = resource.out(rdfs.label).value
  if (!label) {
    throw new Error('Missing project name')
  }
  const maintainer = resource.out(schema.maintainer).term
  if (!maintainer || maintainer.termType !== 'NamedNode') {
    throw new DomainError('Missing organization or not a named node')
  }
  const hiddenCube = resource.out(cc.isHiddenCube).term
  if (!hiddenCube || hiddenCube.termType !== 'Literal' || hiddenCube.datatype.value !== 'http://www.w3.org/2001/XMLSchema#boolean') {
    throw new DomainError('Missing flag isHiddenCube or not a boolean')
  }
  const isHiddenCube = hiddenCube.value === 'true'

  let project: Project.Project
  let dataset: Dataset.Dataset

  const projectNode = await store.createMember(projectsCollection.term, id.cubeProject(label))

  const isCsvProject = cc['projectSourceKind/CSV'].equals(resource.out(cc.projectSourceKind).term)
  const isImportProject = cc['projectSourceKind/ExistingCube'].equals(resource.out(cc.projectSourceKind).term)

  if (isCsvProject) {
    ({ project, dataset } = await createCsvProjectResource({
      user,
      projectNode,
      store,
      label,
      maintainer,
      isHiddenCube,
      resource,
    }))
  } else if (isImportProject) {
    ({ project, dataset } = await createImportProjectResources({
      user,
      projectNode,
      store,
      resource,
      label,
      maintainer,
      isHiddenCube,
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
