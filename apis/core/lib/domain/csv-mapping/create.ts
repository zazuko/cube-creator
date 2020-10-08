import { GraphPointer } from 'clownface'
// import { rdf, hydra, dbo } from '@tpluscode/rdf-ns-builders'
// import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
// import * as id from '../identifiers'
// import { saveFile } from '../../storage/s3'

interface CreateCSVMappingCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function createCSVMapping({
  resource,
  store,
}: CreateCSVMappingCommand): Promise<GraphPointer> {
  throw new Error('Not implemented')
  /*
  const project = resource.

  const csvMapping = store
    .create(id.csvMapping(project))
    .addOut(rdf.type, [cc.CsvMapping, hydra.Resource])

  await store.save()

  return csvMapping

  */
}
