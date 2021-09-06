import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { CsvSource } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { MediaObject } from '@rdfine/schema'
import { ResourceStore } from '../../ResourceStore'
import { error } from '../../log'
import { loadFileHeadString } from '../csv/file-head'
import { parse } from '../csv'
import { sampleValues } from '../csv/sample-values'
import type { MediaStorage } from '../../storage'
import { getMediaStorage } from '../../storage'

interface UpdateCsvSourceCommand {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
  getStorage?: (m: MediaObject) => MediaStorage
}

export async function update({
  resource,
  store,
  getStorage = getMediaStorage,
}: UpdateCsvSourceCommand): Promise<GraphPointer> {
  const changed = RdfResource.factory.createEntity<CsvSource>(resource)
  const csvSource = await store.getResource<CsvSource>(resource.term)

  csvSource.name = changed.name
  if (csvSource.setDialect(changed.dialect) && csvSource.associatedMedia.identifierLiteral) {
    csvSource.pointer.deleteOut(schema.error)
    csvSource.columns = []

    await createOrUpdateColumns(csvSource, getStorage)
  }

  return csvSource.pointer
}

export async function createOrUpdateColumns(csvSource: CsvSource, getStorage: (media: MediaObject) => MediaStorage): Promise<void> {
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
  } catch (err) {
    error(err)
    csvSource.pointer.addOut(schema.error, err.message)
  }
}
