import { PassThrough } from 'readable-stream'
import $rdf from 'rdf-ext'
import { Stream } from 'rdf-js'
import { readable } from 'duplex-to'
import { CsvSource } from '@cube-creator/model'
import fetch from 'node-fetch'
import type { Context } from 'barnard59-core/lib/Pipeline'

export function openFromCsvw(this: Context) {
  const csvStream = new PassThrough()
  const Hydra = this.variables.get('apiClient')
  const csvw = this.variables.get('transformed').csvwResource
  const lastTransformed = this.variables.get('lastTransformed')

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

    this.logger.info(`Downloading CSV from ${representation.root.associatedMedia.contentUrl.value}`)
    const csvResponse = await fetch(representation.root.associatedMedia.contentUrl.value)

    if (!csvResponse?.ok || !csvResponse.body) {
      csvStream.emit('error', new Error('Failed to load CSV. Response was: ' + csvResponse?.statusText))
      return
    }

    lastTransformed.csv = representation.root.name
    lastTransformed.row = 0

    ;(csvResponse.body as any).pipe(csvStream)
  })

  return readable(csvStream)
}

export function getCsvwTriples(this: Context): Stream {
  const csvw = this.variables.get('transformed').csvwResource

  return csvw.pointer.dataset
    .match(null, null, null, csvw.id)
    .map(quad => $rdf.triple(quad.subject, quad.predicate, quad.object))
    .toStream()
}
