import { PassThrough } from 'readable-stream'
import { RdfResource } from '@tpluscode/rdfine'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { Stream } from 'rdf-js'
import * as Csvw from '@rdfine/csvw'
import { Hydra } from 'alcaeus/node'

export function openFromCsvw(csvw: Csvw.Table) {
  const csvStream = new PassThrough()

  Promise.resolve().then(async () => {
    const { response } = await Hydra.loadResource(csvw.url!, {
      accept: 'text/csv',
    })

    if (response && response.xhr.body) {
      (response.xhr.body as any).pipe(csvStream)
    } else {
      csvStream.end()
    }
  })

  return csvStream
}

export function getCsvwTriples(csvw: RdfResource<DatasetExt>): Stream {
  return csvw.pointer.dataset
    .match(null, null, null, csvw.id)
    .map(quad => $rdf.triple(quad.subject, quad.predicate, quad.object))
    .toStream()
}
