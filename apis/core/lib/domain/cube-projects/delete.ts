import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { getSourcesToMapping } from '../queries/csv-source'
import clownface from 'clownface'
import { cc } from '@cube-creator/core/namespace'

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
    const sources = getSourcesToMapping(csvMapping)
  // sources.forEach(item => deleteSource(item))
  // store.delete(csvMapping)
  // and delete them
  }

  // delete project graph
  // store.delete(project) not implemented yet
  store.save()
}
