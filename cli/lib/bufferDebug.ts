import stream from 'readable-stream'
import type Pipeline from 'barnard59-core/lib/Pipeline'
import type { BoundBaseObserver } from '@opentelemetry/api-metrics'
import { bufferObserver } from './otel/metrics'

const { finished } = stream

function bufferStatePair({ state, step }: any): { key: string; value: number } {
  const key = step.ptr.value // `[${index}] (${mode}) ${step.ptr.value} (${state.length}/${state.highWaterMark})`
  const value = state.length > 0 ? Math.round(state.length / state.highWaterMark * 100.0) : 0

  return { key, value }
}

function bufferInfo(pipeline: Pipeline) {
  const steps = pipeline.children

  if (!steps) {
    return
  }

  return steps.reduce<Record<string, number>>((data, step, index) => {
    if ('_writableState' in step.stream) {
      const { key, value } = bufferStatePair({
        index,
        mode: 'write',
        state: step.stream._writableState,
        step,
      })

      data[key] = value
    }

    if ('_readableState' in step.stream) {
      const { key, value } = bufferStatePair({
        index,
        mode: 'read',
        state: step.stream._readableState,
        step,
      })

      data[key] = value
    }

    return data
  }, {})
}

function bufferDebug(pipeline: Pipeline, jobUri: string, { interval = 10 } = {}): void {
  let done = false

  finished(pipeline.stream, () => {
    done = true
  })

  const pid = process.pid.toString()
  const boundMeters = new Map<string, BoundBaseObserver>()
  function getMeter(step: string) {
    const bound = boundMeters.get(step) || bufferObserver.bind({
      jobUri,
      pipeline: pipeline.ptr.value,
      step,
      pid,
    })

    boundMeters.set(step, bound)

    return bound
  }

  const next = async () => {
    if (done) {
      return
    }

    const data = bufferInfo(pipeline)

    if (data) {
      [...Object.entries(data)].forEach(([step, value]) => {
        getMeter(step).update(value)
      })
    }

    setTimeout(next, interval)
  }

  next()
}

export default bufferDebug
