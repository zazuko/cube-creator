import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { rdf, hydra, dbo } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { saveFile } from '../../storage/s3'

interface CreateCSVMappingCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function createCSVMapping({ resource, store }: CreateCSVMappingCommand): Promise<GraphPointer> {
  const filename = resource.out(dbo.filename).term!

  await saveFile(filename.value, 'hello')

  const csvMapping = clownface({ dataset: $rdf.dataset() })
    .namedNode(id.csvMapping(filename.value))
    .addOut(dbo.filename, filename)
    .addOut(rdf.type, [cc.CsvMapping, hydra.Resource])

  await store.put(csvMapping)
  return csvMapping
}
