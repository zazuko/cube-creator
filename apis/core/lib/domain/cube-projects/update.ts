import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { rdfs } from '@tpluscode/rdf-ns-builders'
import { CsvMapping, Project, Dataset, DimensionMetadataCollection } from '@cube-creator/model'

interface UpdateProjectCommand {
  resource: GraphPointer
  project: GraphPointer<NamedNode>
  store: ResourceStore
}

export async function updateProject({
  resource,
  project,
  store,
}: UpdateProjectCommand): Promise<Project> {
  const storedProject = await store.getResource<Project>(resource.term)

  storedProject.rename(resource.out(rdfs.label).value!)

  const newNamespace = resource.out(cc.namespace).term as NamedNode
  const csvMapping = await store.getResource<CsvMapping>(project.out(cc.csvMapping).term, { allowMissing: true })
  if (csvMapping) {
    const currentNamespace = csvMapping.updateNamespace(newNamespace)
    if (!currentNamespace.equals(newNamespace)) {
      const dataset = await store.getResource<Dataset>(storedProject.dataset?.id)
      dataset.renameCube(currentNamespace, newNamespace)
      const metadata = await store.getResource<DimensionMetadataCollection>(dataset.dimensionMetadata.id)
      metadata.renameDimensions(currentNamespace, newNamespace)
    }
  }

  storedProject.updatePublishGraph(resource.out(cc.publishGraph).term)

  return storedProject
}
