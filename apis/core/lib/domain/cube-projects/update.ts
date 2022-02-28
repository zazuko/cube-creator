import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { DomainError } from '@cube-creator/api-errors'
import { cc } from '@cube-creator/core/namespace'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { CsvProject, ImportProject, Project } from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import type { Dictionary } from '@rdfine/prov'
import { isCsvProject } from '@cube-creator/model/Project'
import { ResourceStore } from '../../ResourceStore'
import { cubeNamespaceAllowed } from '../organization/query'
import { exists, previouslyPublished } from './queries'

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

    currentCube = organization.createIdentifier({
      cubeIdentifier: identifier.after,
    })
    previousCube = previousOrganization.createIdentifier({
      cubeIdentifier: identifier.before,
    })

    if (identifier.after !== identifier.before) {
      if (await previouslyPublished(project)) {
        throw new DomainError('Cannot change cube identifier once a project has been published')
      }

      if (await exists(identifier.after, maintainer.after)) {
        throw new DomainError('Another project is already using same identifier')
      }
    }
  } else {
    const cubeId = project.updateImportCube(resource.out(cc['CubeProject/sourceCube']).term)
    currentCube = cubeId.after
    previousCube = cubeId.before

    project.updateImportGraph(resource.out(cc['CubeProject/sourceGraph']).term)
    project.updateImportEndpoint(resource.out(cc['CubeProject/sourceEndpoint']).term)
  }

  if (!previousCube.equals(currentCube) || !maintainer.after.equals(maintainer.before)) {
    if (await previouslyPublished(project)) {
      throw new DomainError('Cannot change cube identifier once a project has been published')
    }

    if (await exists(currentCube, maintainer.after)) {
      throw new DomainError('Another project already produces a cube with that URI')
    }

    if (await cubeNamespaceAllowed(currentCube, maintainer.after) === false) {
      throw new DomainError("Imported cube does not match the Organisation's base URI")
    }

    const dataset = await store.getResource(project.dataset)
    dataset.renameCube(previousCube, currentCube)

    const metadata = await store.getResource(dataset.dimensionMetadata)
    metadata.renameDimensions(previousCube, currentCube)

    for (const dimMetadata of metadata.hasPart) {
      if (dimMetadata.mappings) {
        const mappings = await store.getResource<Dictionary>(dimMetadata.mappings)
        mappings.renameDimension(previousCube, currentCube)
      }
    }
  }

  return project
}
