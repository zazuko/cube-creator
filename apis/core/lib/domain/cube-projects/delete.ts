import type { NamedNode } from '@rdfjs/types'
import { Project } from '@cube-creator/model'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { SELECT } from '@tpluscode/sparql-builder'
import { ResourceStore } from '../../ResourceStore.js'
import { deleteMapping } from '../csv-mapping/delete.js'

interface DeleteProjectCommand {
  resource: NamedNode
  store: ResourceStore
  client: ParsingClient
}

export async function deleteProject({
  resource,
  store,
  client,
}: DeleteProjectCommand): Promise<void> {
  const project = await store.getResource<Project>(resource, { allowMissing: true })
  if (!project) return

  const { csvMapping } = project
  if (csvMapping?.id.termType === 'NamedNode') {
    await deleteMapping(csvMapping.id, store)
  }

  const graphs: Array<{ graph?: NamedNode }> = await SELECT.DISTINCT`?graph`
    .WHERE`
      graph ?graph {
        ?s ?p ?o
      }
      filter(strstarts(str(?graph), "${project.id.value}"))
    `.execute(client)

  for (const { graph } of graphs) {
    if (graph) {
      store.delete(graph)
    }
  }
}
