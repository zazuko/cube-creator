import { PassThrough } from 'readable-stream'
import { RdfResource } from '@tpluscode/rdfine'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { Stream } from 'rdf-js'
import * as Csvw from '@rdfine/csvw'
import { readable } from 'duplex-to'
import { CsvSource } from '@cube-creator/model'
import fetch from 'node-fetch'
import type { Context } from 'barnard59-core/lib/Pipeline'

export function openFromCsvw(this: Context, csvw: Csvw.Table) {
  const csvStream = new PassThrough()
  const Hydra = this.variables.get('apiClient')

  Promise.resolve().then(async () => {
    const { response, representation } = await Hydra.loadResource<CsvSource>(csvw.url!)
    if (!representation?.root) {
      csvStream.emit('error', new Error('Failed to load Source. Response was: ' + response?.xhr.statusText))
      return
    }

    if (!representation.root.associatedMedia.contentUrl) {
      csvStream.emit('error', new Error('Failed to load CSV. Missing link from source'))
      return
    }

    this.log.info(`Downloading CSV from ${representation.root.associatedMedia.contentUrl.value}`)
    const csvResponse = await fetch(representation.root.associatedMedia.contentUrl.value)

    if (!csvResponse?.ok || !csvResponse.body) {
      csvStream.emit('error', new Error('Failed to load CSV. Response was: ' + csvResponse?.statusText))
      return
    }

    (csvResponse.body as any).pipe(csvStream)
  })

  return readable(csvStream)
}

export function getCsvwTriples(csvw: RdfResource<DatasetExt>): Stream {
  return csvw.pointer.dataset
    .match(null, null, null, csvw.id)
    .map(quad => $rdf.triple(quad.subject, quad.predicate, quad.object))
    .toStream()
}
