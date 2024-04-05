import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { CsvSource } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore.js'
import { error } from '../../log.js'
import { loadFileHeadString } from '../csv/file-head.js'
import { parse } from '../csv/index.js'
import { sampleValues } from '../csv/sample-values.js'
import type { GetMediaStorage } from '../../storage/index.js'
import { getMediaStorage } from '../../storage/index.js'

interface UpdateCsvSourceCommand {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
  getStorage?: GetMediaStorage
}

export async function update({
  resource,
  store,
  getStorage = getMediaStorage,
}: UpdateCsvSourceCommand): Promise<GraphPointer> {
  const changed = $rdf.rdfine().factory.createEntity<CsvSource>(resource)
  const csvSource = await store.getResource<CsvSource>(resource.term)

  csvSource.name = changed.name
  if (csvSource.setDialect(changed.dialect) && csvSource.associatedMedia?.identifierLiteral) {
    csvSource.pointer.deleteOut(schema.error)
    csvSource.columns = []

    await createOrUpdateColumns(csvSource, getStorage)
  }

  return csvSource.pointer
}

export async function createOrUpdateColumns(csvSource: CsvSource, getStorage: GetMediaStorage): Promise<void> {
  if (!csvSource.associatedMedia) {
    return
  }

  try {
    const storage = getStorage(csvSource.associatedMedia)
    const fileStream = await storage.getStream(csvSource.associatedMedia)
    const head = await loadFileHeadString(fileStream, 500)
    const { header, rows } = await parse(head, {
      bom: true,
      delimiter: csvSource.dialect.delimiter,
      quote: csvSource.dialect.quoteChar,
    })

    const sampleCol = sampleValues(header, rows)

    for (let index = 0; index < header.length; index++) {
      const name = header[index]
      const column = csvSource.appendOrUpdateColumn({ name, order: index })
      column.samples = sampleCol[index]
    }
  } catch (err: any) {
    error(err)
    csvSource.pointer.addOut(schema.error, err.message)
  }
}
