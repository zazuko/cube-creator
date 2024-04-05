import type { Quad } from '@rdfjs/types'
import type { Context } from 'barnard59-core'
import { PassThrough } from 'readable-stream'
import through2 from 'through2'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { metrics } from '@opentelemetry/api'

const meter = metrics.getMeter('@cube-creator/cli')

export const quadCounter = meter.createCounter('quads')

export function quads(this: Context, name: string) {
  const jobUri = this.variables.get('jobUri')
  const forwarder = new PassThrough({
    objectMode: true,
  })

  forwarder.on('data', () => {
    quadCounter.add(1, {
      name,
      job_id: jobUri.substr(jobUri.lastIndexOf('/') + 1),
    })
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
