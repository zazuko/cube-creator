import fetch from 'node-fetch'
import { createReadStream } from 'fs'
import type { VariableMap } from 'barnard59-core'
import { tracer } from '../otel/tracer'
import { logger } from '../log'

export function uploadCube(variables: VariableMap) {
  return tracer.startActiveSpan('cube upload', async span => {
    try {
      const endpoint = variables.get('publish-graph-store-endpoint')
      const cubeFile = variables.get('targetFile')
      const username = variables.get('publish-graph-store-user')
      const password = variables.get('publish-graph-store-password')

      logger.info('Uploading cube to database')
      await fetch(endpoint, {
        method: 'POST',
        body: createReadStream(cubeFile),
        headers: {
          'content-type': 'application/n-quads',
          Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
        },
      })
    } finally {
      span.end()
    }
  })
}
