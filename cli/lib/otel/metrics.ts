import { CollectorMetricExporter } from '@opentelemetry/exporter-collector'
import { MeterProvider } from '@opentelemetry/metrics'

const exporter = new CollectorMetricExporter()

const meterProvider = new MeterProvider({
  exporter,
  interval: 2000,
})

const meter = meterProvider.getMeter('quad stream meter')
export const quadCounter = meter.createCounter('quads')

export const bufferObserver = meter.createValueObserver('buffer')
