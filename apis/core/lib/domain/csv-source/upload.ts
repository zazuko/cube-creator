import { GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { MediaObject } from '@rdfine/schema'
import { Conflict } from 'http-errors'
import { NamedNode } from 'rdf-js'
import { error } from '../../log'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../csv/file-head'
import { sniffParse } from '../csv'
import { sampleValues } from '../csv/sample-values'
import * as CsvSourceQueries from '../queries/csv-source'
import { CsvMapping } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import type { MediaStorage } from '../../storage'
import { getMediaStorage } from '../../storage'

interface CreateCSVSourceCommand {
  csvMappingId: NamedNode
  resource: GraphPointer
  store: ResourceStore
  getStorage?: (m: MediaObject) => MediaStorage
  csvSourceQueries?: Pick<typeof CsvSourceQueries, 'sourceWithFilenameExists'>
}

export async function createCSVSource({
  csvMappingId,
  resource,
  store,
  getStorage = getMediaStorage,
  csvSourceQueries: { sourceWithFilenameExists } = CsvSourceQueries,
}: CreateCSVSourceCommand): Promise<GraphPointer> {
  const csvMapping = await store.getResource<CsvMapping>(csvMappingId)

  const sourceKind = resource.out(cc.sourceKind).term! as NamedNode
  const fileName = resource.out(schema.name).value!
  const key = resource.out(schema.identifier).value! || ''
  const location = resource.out(schema.contentUrl).term! as NamedNode

  if (await sourceWithFilenameExists(csvMapping.id, fileName)) {
    throw new Conflict(`A file with ${fileName} has already been added to the project`)
  }

  const csvSource = csvMapping.addSource(store, { fileName })
  csvSource.setUploadedFile(sourceKind, key, location)

  try {
    const media = csvSource.associatedMedia
    const storage = getStorage(media)
    const fileStream = await storage.getStream(media)
    const head = await loadFileHeadString(fileStream, 500)
    const { dialect, header, rows } = await sniffParse(head)
    const sampleCol = sampleValues(header, rows)

    csvSource.setDialect({
      quoteChar: dialect.quote,
      delimiter: dialect.delimiter,
      header: true,
      headerRowCount: header.length,
    })

    for (let index = 0; index < header.length; index++) {
      const name = header[index]
      const column = csvSource.appendOrUpdateColumn({ name, order: index })
      column.samples = sampleCol[index]
    }
  } catch (err) {
    error(err)
    csvSource.pointer.addOut(schema.error, err.message)
  }

  return csvSource.pointer
}
