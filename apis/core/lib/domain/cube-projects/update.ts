import { GraphPointer } from 'clownface'
import { DomainError } from '@cube-creator/api-errors'
import { ResourceStore } from '../../ResourceStore'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { Project } from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import { exists } from './queries'

interface UpdateProjectCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function updateProject({
  resource,
  store,
}: UpdateProjectCommand): Promise<Project> {
  const project = await store.getResource<Project>(resource.term)

  project.rename(resource.out(rdfs.label).value)
  const identifier = project.updateCubeIdentifier(resource.out(dcterms.identifier).value)
  const maintainer = project.updateMaintainer(resource.out(schema.maintainer).term)

  if (identifier.before !== identifier.after || !maintainer.after.equals(maintainer.before)) {
    if (await exists(identifier.after, maintainer.after)) {
      throw new DomainError('Another project is already using same identifier')
    }

    let previousOrganization: Organization
    const organization = await store.getResource(project.maintainer)
    if (maintainer.before.equals(maintainer.after)) {
      previousOrganization = organization
    } else {
      previousOrganization = await store.getResource<Organization>(maintainer.before)
    }

    const currentCube = organization.createIdentifier({
      cubeIdentifier: identifier.after,
    })
    const previousCube = previousOrganization.createIdentifier({
      cubeIdentifier: identifier.before,
    })

    const dataset = await store.getResource(project.dataset)
    dataset.renameCube(previousCube, currentCube)

    const metadata = await store.getResource(dataset.dimensionMetadata)
    metadata.renameDimensions(previousCube, currentCube)
  }

  return project
}
