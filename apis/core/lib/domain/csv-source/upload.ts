import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import { CsvMapping } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { error } from '../../log.js'
import { ResourceStore } from '../../ResourceStore.js'
import { loadFileHeadString } from '../csv/file-head.js'
import { sniffParse } from '../csv/index.js'
import { sampleValues } from '../csv/sample-values.js'
import * as CsvSourceQueries from '../queries/csv-source.js'
import type { GetMediaStorage } from '../../storage/index.js'
import { getMediaStorage } from '../../storage/index.js'

interface CreateCSVSourceCommand {
  csvMappingId: NamedNode
  resource: GraphPointer
  store: ResourceStore
  getStorage?: GetMediaStorage
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
  const key = resource.out(schema.identifier).value || undefined
  const location = (resource.out(schema.contentUrl).term || undefined) as NamedNode | undefined

  if (await sourceWithFilenameExists(csvMapping.id, fileName)) {
    throw new httpError.Conflict(`A file with ${fileName} has already been added to the project`)
  }

  const csvSource = csvMapping.addSource(store, { fileName })
  csvSource.setUploadedFile(sourceKind, key, location)

  try {
    const media = csvSource.associatedMedia
    if (media) {
      const storage = getStorage(media)
      const fileStream = await storage.getStream(media)
      const head = await loadFileHeadString(fileStream, 500)
      const { dialect, header, rows } = await sniffParse(head)
      const sampleCol = sampleValues(header, rows)

      csvSource.setDialect({
        quoteChar: dialect.quote || undefined,
        delimiter: dialect.delimiter || undefined,
        header: true,
        headerRowCount: header.length,
      })

      for (let index = 0; index < header.length; index++) {
        const name = header[index]
        const column = csvSource.appendOrUpdateColumn({ name, order: index })
        column.samples = sampleCol[index]
      }
    }
  } catch (err: any) {
    error(err)
    csvSource.pointer.addOut(schema.error, err.message)
  }

  return csvSource.pointer
}
