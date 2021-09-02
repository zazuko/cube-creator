import { PassThrough } from 'readable-stream'
import { quadCounter } from './otel/metrics.mjs'

export function quads(name) {
  const bound = quadCounter.bind({
    name,
  })
  const forwarder = new PassThrough({
    objectMode: true,
  })

  forwarder.on('data', () => {
    bound.add(1)
  })

  return forwarder
}
