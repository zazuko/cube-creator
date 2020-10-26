import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { getSourcesFromMapping } from '../queries/csv-source'
import clownface from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { deleteSourceWithoutSave } from '../csv-source/delete'

interface DeleteProjectCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function deleteProject({
  resource,
  store = resourceStore(),
}: DeleteProjectCommand): Promise<void> {
  const project = await store.get(resource)
  const csvMapping = clownface(project).out(cc.csvMapping).term
  // Find csv sources

  if (csvMapping?.termType === 'NamedNode') {
    const sources = await getSourcesFromMapping(csvMapping)
    for (const source of sources) {
      await deleteSourceWithoutSave(source, store)
    }
    store.delete(csvMapping)
  }

  // delete project graph
  store.delete(project.term)
  await store.save()
}
