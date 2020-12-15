import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { CsvSource } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import { schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore'
import { error } from '../../log'
import { Readable } from 'stream'
import * as s3 from '../../storage/s3'
import { loadFileHeadString } from '../csv/file-head'
import { parse } from '../csv'
import { sampleValues } from '../csv/sample-values'

interface UpdateCsvSourceCommand {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
  fileStorage?: s3.FileStorage
}

export async function update({
  resource,
  store,
  fileStorage = s3,
}: UpdateCsvSourceCommand): Promise<GraphPointer> {
  const changed = RdfResource.factory.createEntity<CsvSource>(resource)
  const csvSource = await store.getResource<CsvSource>(resource.term)

  csvSource.name = changed.name
  if (csvSource.setDialect(changed.dialect) && csvSource.associatedMedia.identifierLiteral) {
    try {
      csvSource.pointer.deleteOut(schema.error)
      csvSource.columns = []

      const fileStream = await fileStorage.loadFile(csvSource.associatedMedia.identifierLiteral) as Readable
      const head = await loadFileHeadString(fileStream, 500)
      const { header, rows } = await parse(head, {
        delimiter: csvSource.dialect.delimiter,
        quote: csvSource.dialect.quoteChar,
      })

      const sampleCol = sampleValues(header, rows)

      for (let index = 0; index < header.length; index++) {
        const name = header[index]
        const column = csvSource.appendColumn({ name })
        column.samples = sampleCol[index]
      }
    } catch (err) {
      error(err)
      csvSource.pointer.addOut(schema.error, err.message)
    }
  }

  return csvSource.pointer
}
