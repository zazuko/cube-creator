import { NamedNode } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { deleteMapping } from '../csv-mapping/delete'

interface DeleteProjectCommand {
  resource: NamedNode
  store: ResourceStore
}

export async function deleteProject({
  resource,
  store,
}: DeleteProjectCommand): Promise<void> {
  const project = await store.get(resource, { allowMissing: true })
  if (!project) return

  const csvMapping = project.out(cc.csvMapping).term

  // Find csv sources
  if (csvMapping?.termType === 'NamedNode') {
    await deleteMapping(csvMapping, store)
  }

  // delete project graph
  store.delete(project.term)
}
