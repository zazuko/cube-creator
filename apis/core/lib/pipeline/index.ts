import type { GraphPointer } from 'clownface'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'

interface TriggerCallback {
  job: GraphPointer
  res: Response
  fetch?: typeof fetch
  client: ParsingClient
}

export interface TriggerCallbacks {
  onSuccess?: (response: TriggerCallback) => void
}

export type TriggerCallbackMap = Record<string, TriggerCallbacks>
