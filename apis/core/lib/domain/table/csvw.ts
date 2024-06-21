import type { NamedNode } from '@rdfjs/types'
import * as Csvw from '@rdfine/csvw'
import { NotFoundError } from '@cube-creator/api-errors'
import $rdf from '@cube-creator/env'
import { ResourceStore } from '../../ResourceStore.js'
import { buildCsvw } from '../../csvw-builder/index.js'
import '../../domain/index.js'

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

  const table = $rdf.rdfine.cc.Table(tablePointer)

  return buildCsvw({ table, resources })
}
