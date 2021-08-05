import type { Context } from 'barnard59-core/lib/Pipeline'
import { PassThrough } from 'readable-stream'
import { quadCounter } from './otel/metrics'

export function quads(this: Context, name: string) {
  const jobUri = this.variables.get('jobUri')
  const bound = quadCounter.bind({
    pid: process.pid.toString(),
    name,
    jobId: jobUri.substr(jobUri.lastIndexOf('/') + 1),
  })
  const forwarder = new PassThrough({
    objectMode: true,
  })

  forwarder.on('data', () => {
    bound.add(1)
  })

  return forwarder
}
