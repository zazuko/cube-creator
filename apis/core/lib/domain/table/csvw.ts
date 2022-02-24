import { NamedNode } from 'rdf-js'
import * as Table from '@cube-creator/model/Table'
import * as Csvw from '@rdfine/csvw'
import { NotFoundError } from '@cube-creator/api-errors'
import { ResourceStore } from '../../ResourceStore'
import { buildCsvw } from '../../csvw-builder'
import '../../domain'

interface Command {
  tableResource: NamedNode
  resources: ResourceStore
}

export async function createCsvw({
  tableResource,
  resources,
}: Command): Promise<Csvw.Table> {
  const tablePointer = await resources.get(tableResource)
  if (!tablePointer) {
    throw new NotFoundError(tableResource)
  }

  const table = Table.fromPointer(tablePointer)

  return buildCsvw({ table, resources })
}
