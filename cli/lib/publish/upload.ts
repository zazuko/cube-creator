import { spawnSync } from 'child_process'
import type { VariableMap } from 'barnard59-core'
import { tracer } from '../otel/tracer'
import { logger } from '../log'

export function uploadCube(variables: VariableMap) {
  return tracer.startActiveSpan('cube upload', span => {
    try {
      const endpoint = new URL(variables.get('publish-graph-store-endpoint'))
      const cubeFile = variables.get('targetFile')
      const username = variables.get('publish-graph-store-user')
      const password = variables.get('publish-graph-store-password')
      const graph = variables.get('target-graph')

      endpoint.searchParams.set('graph', graph)

      logger.info('Uploading cube to database')
      const exit = spawnSync('curl', [
        endpoint.toString(),
        '-X', 'POST',
        '-u', `${username}:${password}`,
        '-T',
        cubeFile,
        '-H', 'content-type:text/turtle',
        '--fail-with-body',
      ],
      { stdio: [process.stdin, process.stdout, process.stderr] })

      if (exit.status) {
        throw new Error(`Upload failed. Curl exited with ${exit.status}`)
      }
    } finally {
      span.end()
    }
  })
}
