import stream from 'readable-stream'
import type Pipeline from 'barnard59-core/lib/Pipeline'
import { metrics } from '@opentelemetry/api'

const { finished } = stream as any

const meter = metrics.getMeter('@cube-creator/cli')

export const bufferObserver = meter.createHistogram('buffer')

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
    if ('_writableState' in step.stream!) {
      const { key, value } = bufferStatePair({
        index,
        mode: 'write',
        state: step.stream._writableState,
        step,
      })

      data[key] = value
    }

    if ('_readableState' in step.stream!) {
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

  const next = async () => {
    if (done) {
      return
    }

    const data = bufferInfo(pipeline)

    if (data) {
      [...Object.entries(data)].forEach(([step, value]) => {
        bufferObserver.record(value, {
          job_uri: jobUri,
          pipeline: pipeline.ptr.value,
          step,
          pid,
        })
      })
    }

    setTimeout(next, interval)
  }

  next()
}

export default bufferDebug
