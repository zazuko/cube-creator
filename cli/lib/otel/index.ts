import { CollectorTraceExporter, CollectorMetricExporter } from '@opentelemetry/exporter-collector'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { Resource, envDetector, processDetector } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ResourceAttributes } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  // Automatic detection is disabled, see comment below
  autoDetectResources: false,
  traceExporter: new CollectorTraceExporter(),
  metricExporter: new CollectorMetricExporter(),
  instrumentations: [
    new HttpInstrumentation(),
    new WinstonInstrumentation(),
  ],
  resource: new Resource({
    [ResourceAttributes.SERVICE_NAME]: 'cube-creator-cli',
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
    await sdk.detectResources({ detectors: [envDetector, processDetector] })

    await sdk.start()

    process.on('uncaughtException', onError)
    process.on('SIGINT', onError)
    process.on('SIGTERM', onError)
  } catch (e) {
    await onError(e)
  }

  return sdk.shutdown.bind(sdk)
}