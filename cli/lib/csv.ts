import { createReadStream } from 'fs'
import path from 'path'
import { RdfResource } from '@tpluscode/rdfine'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { Stream } from 'rdf-js'
import * as Csvw from '@rdfine/csvw'

export function openFromCsvw(csvw: Csvw.Table, sourceDir: string) {
  return createReadStream(path.resolve(sourceDir, csvw.url!))
}

export function getCsvwTriples(csvw: RdfResource<DatasetExt>): Stream {
  return csvw.pointer.dataset
    .match(null, null, null, csvw.id)
    .map(quad => $rdf.triple(quad.subject, quad.predicate, quad.object))
    .toStream()
}
