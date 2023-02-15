import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  // Automatic detection is disabled, see comment below
  autoDetectResources: false,
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
