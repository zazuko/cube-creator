import { metrics } from '@opentelemetry/api-metrics'

const meter = metrics.getMeter('@cube-creator/cli')

export const quadCounter = meter.createCounter('quads')

export const bufferObserver = meter.createHistogram('buffer')
