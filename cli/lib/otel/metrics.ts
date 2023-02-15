import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'

const otlpMetricExporter = new OTLPMetricExporter()

const metrics = new MeterProvider()

const meter = metrics.getMeter('@cube-creator/cli')

export const quadCounter = meter.createCounter('quads')

export const bufferObserver = meter.createHistogram('buffer')

export const metricReader = new PeriodicExportingMetricReader({
  exporter: otlpMetricExporter,
  exportIntervalMillis: 1000,
})

metrics.addMetricReader(metricReader)
