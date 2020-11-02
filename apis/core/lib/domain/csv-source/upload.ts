import { GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import * as s3 from '../../storage/s3'
import { error } from '../../log'
import env from '@cube-creator/core/env'
import { ResourceStore } from '../../ResourceStore'
import { loadFileHeadString } from '../csv/file-head'
import { sniffParse } from '../csv'
import * as CsvSourceQueries from '../queries/csv-source'
import { Conflict } from 'http-errors'
import { resourceStore } from '../resources'
import { sampleValues } from '../csv/sample-values'
import { NotFoundError } from '../../errors'
import { CsvMapping } from '@cube-creator/model'

interface UploadCSVCommand {
  file: Readable | Buffer
  fileName: string
  resource: NamedNode
  store?: ResourceStore
  fileStorage?: s3.FileStorage
  csvSourceQueries?: Pick<typeof CsvSourceQueries, 'sourceWithFilenameExists'>
}

export async function uploadFile({
  file,
  fileName,
  resource,
  store = resourceStore(),
  fileStorage = s3,
  csvSourceQueries: { sourceWithFilenameExists } = CsvSourceQueries,
}: UploadCSVCommand): Promise<GraphPointer> {
  const csvMapping = await store.getResource<CsvMapping>(resource)
  if (!csvMapping) {
    throw new NotFoundError(resource)
  }

  if (await sourceWithFilenameExists(csvMapping.id, fileName)) {
    throw new Conflict(`A file with ${fileName} has already been added to the project`)
  }

  const key = `${csvMapping.id.value.replace(env.API_CORE_BASE, '')}/${fileName}`
  const upload = await fileStorage.saveFile(key, file)

  const csvSource = csvMapping.addSource(store, { fileName })
  csvSource.setUploadedFile(key, $rdf.namedNode(upload.Location))

  try {
    const fileStream = await fileStorage.loadFile(key) as Readable
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
      const column = csvSource.appendColumn({ name })
      column.samples = sampleCol[index]
    }
  } catch (err) {
    error(err)
    csvSource.pointer.addOut(schema.error, err.message)
  }

  await store.save()

  return csvSource.pointer
}
