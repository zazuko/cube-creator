import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

export const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
  exportIntervalMillis: 1000,
})

const sdk = new NodeSDK({
  // Automatic detection is disabled, see comment below
  autoDetectResources: false,
  metricReader,
  instrumentations: [
    new HttpInstrumentation(),
    new WinstonInstrumentation(),
  ],
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'cube-creator-cli',
  }),
})

const onError = async (err: Error) => {
  // Remove signal handler to quit immediately when receiving multiple
  // SIGINT/SIGTEM
  process.off('SIGINT', onError)
  process.off('SIGTERM', onError)

  if (err) {
    // eslint-disable-next-line no-console
    console.log(err)
  }
  await sdk.shutdown()
  process.exit(1)
}

export async function opentelemetry() {
  try {
    await sdk.detectResources()

    await sdk.start()

    process.on('uncaughtException', onError)
    process.on('SIGINT', onError)
    process.on('SIGTERM', onError)
  } catch (e: any) {
    await onError(e)
  }

  return sdk.shutdown.bind(sdk)
}
