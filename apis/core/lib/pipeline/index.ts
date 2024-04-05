import { GraphPointer } from 'clownface'
import nodeFetch, { Response } from 'node-fetch'
import type { ParsingClient } from 'sparql-http-client/ParsingClient.js'

interface TriggerCallback {
  job: GraphPointer
  res: Response
  fetch?: typeof nodeFetch
  client: ParsingClient
}

export interface TriggerCallbacks {
  onSuccess?: (response: TriggerCallback) => void
}

export type TriggerCallbackMap = Record<string, TriggerCallbacks>
