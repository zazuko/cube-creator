import { spawnSync } from 'child_process'
import type { VariableMap } from 'barnard59-core'
import { tracer } from '../otel/tracer'
import { logger } from '../log'

export function uploadCube(variables: VariableMap) {
  return tracer.startActiveSpan('cube upload', span => {
    try {
      const endpoint = variables.get('publish-graph-store-endpoint')
      const cubeFile = variables.get('targetFile')
      const username = variables.get('publish-graph-store-user')
      const password = variables.get('publish-graph-store-password')
      const graph = variables.get('target-graph')

      const queryString = new URLSearchParams({
        graph,
      })

      logger.info('Uploading cube to database')
      const exit = spawnSync('curl', [
        endpoint,
        '-G', '-d', queryString.toString(),
        '-X', 'POST',
        '-u', `${username}:${password}`,
        '-T',
        cubeFile,
        '-H', 'content-type:application/n-quads',
        '--fail',
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
