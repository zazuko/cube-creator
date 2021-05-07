import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { DomainError } from '@cube-creator/api-errors'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { CsvProject, ImportProject, Project } from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import { exists } from './queries'
import { isCsvProject } from '@cube-creator/model/Project'

interface UpdateProjectCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function updateProject({
  resource,
  store,
}: UpdateProjectCommand): Promise<Project> {
  const project = await store.getResource<ImportProject | CsvProject>(resource.term)

  project.rename(resource.out(rdfs.label).value)
  const maintainer = project.updateMaintainer(resource.out(schema.maintainer).term)

  let currentCube: NamedNode
  let previousCube: NamedNode

  let previousOrganization: Organization
  const organization = await store.getResource(project.maintainer)
  if (maintainer.before.equals(maintainer.after)) {
    previousOrganization = organization
  } else {
    previousOrganization = await store.getResource<Organization>(maintainer.before)
  }

  if (isCsvProject(project)) {
    const identifier = project.updateCubeIdentifier(resource.out(dcterms.identifier).value)
    if (await exists(identifier.after, maintainer.after)) {
      throw new DomainError('Another project is already using same identifier')
    }

    currentCube = organization.createIdentifier({
      cubeIdentifier: identifier.after,
    })
    previousCube = previousOrganization.createIdentifier({
      cubeIdentifier: identifier.before,
    })
  } else {
    const cubeId = project.updateImportCube(resource.out(cc['CubeProject/importCube']).term)
    currentCube = cubeId.after
    previousCube = cubeId.before

    project.updateImportGraph(resource.out(cc['CubeProject/importFromGraph']).term)
    project.updateImportEndpoint(resource.out(cc['CubeProject/importFromEndpoint']).term)
  }

  if (!previousCube.equals(currentCube) || !maintainer.after.equals(maintainer.before)) {
    const dataset = await store.getResource(project.dataset)
    dataset.renameCube(previousCube, currentCube)

    const metadata = await store.getResource(dataset.dimensionMetadata)
    metadata.renameDimensions(previousCube, currentCube)
  }

  return project
}
