import { schema } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { getDownloadLink } from '../../../storage/s3'
import { warning } from '../../../log'

export function getPresignedLink(csvSource: GraphPointer): string {
  const path = csvSource.out(schema.associatedMedia).out(schema.identifier).value
  if (!path) {
    warning(`Source s3 key not found for ${csvSource.value}`)
    return ''
  }

  return getDownloadLink(path)
}

export function setPresignedLink(csvSource: GraphPointer): void {
  const s3DirectDownload = getPresignedLink(csvSource)
  if (s3DirectDownload) {
    csvSource
      .out(schema.associatedMedia)
      .deleteOut(schema.contentUrl)
      .addOut(schema.contentUrl, csvSource.namedNode(s3DirectDownload))
  }
}
