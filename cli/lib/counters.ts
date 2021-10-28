import type { Context } from 'barnard59-core/lib/Pipeline'
import { PassThrough } from 'readable-stream'
import through2 from 'through2'
import { Quad } from 'rdf-js'
import { csvw } from '@tpluscode/rdf-ns-builders/strict'
import { quadCounter } from './otel/metrics'

export function quads(this: Context, name: string) {
  const jobUri = this.variables.get('jobUri')
  const bound = quadCounter.bind({
    name,
    job_id: jobUri.substr(jobUri.lastIndexOf('/') + 1),
  })
  const forwarder = new PassThrough({
    objectMode: true,
  })

  forwarder.on('data', () => {
    bound.add(1)
  })

  return forwarder
}

export function observeCsvwMetadata(this: Context) {
  const lastTransformed = this.variables.get('lastTransformed')

  return through2.obj(function (chunk: Quad, enc, callback) {
    if (chunk.predicate.equals(csvw.rownum)) {
      lastTransformed.row = Number.parseInt(chunk.object.value, 10)
    }

    this.push(chunk)
    callback()
  })
}
