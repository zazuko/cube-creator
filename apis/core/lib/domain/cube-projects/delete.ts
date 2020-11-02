import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { cc } from '@cube-creator/core/namespace'
import { deleteMapping } from '../csv-mapping/delete'

interface DeleteProjectCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function deleteProject({
  resource,
  store = resourceStore(),
}: DeleteProjectCommand): Promise<void> {
  const project = await store.get(resource)
  if (!project) return

  const csvMapping = project.out(cc.csvMapping).term

  // Find csv sources
  if (csvMapping?.termType === 'NamedNode') {
    await deleteMapping(csvMapping, store)
  }

  // delete project graph
  store.delete(project.term)
  await store.save()
}
