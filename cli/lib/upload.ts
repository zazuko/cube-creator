import fetch from 'node-fetch'
import fs from 'fs'
import type Pipeline from 'barnard59-core/lib/Pipeline'

interface Upload {
  pipeline: Pipeline
  endpoint: string
  username: string | undefined
  password: string | undefined
  graph: string
}

export default async function upload({ pipeline, endpoint, username, password, graph }: Upload): Promise<void> {
  const body = fs.createReadStream(pipeline.context.variables.get('targetFile'))

  const url = new URL(endpoint)
  url.searchParams.append('graph', graph)

  const response = await fetch(url.toString(), {
    body,
    method: 'put',
    headers: {
      'content-type': 'application/n-triples',
      Authorization: `Basic ${Buffer.from(username + ':' + password)}`,
    },
  })

  if (!response.ok) {
    return Promise.reject(response)
  }
}
