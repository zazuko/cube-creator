import fetch from 'node-fetch'
import fs from 'fs'
import type Pipeline from 'barnard59-core/lib/Pipeline'

interface Upload {
  pipeline: Pipeline
  endpoint: string
  username: string | undefined
  password: string | undefined
  graph: string
  method: 'post' | 'put'
}

export default async function upload({ method, pipeline, endpoint, username, password, graph }: Upload): Promise<void> {
  const body = fs.createReadStream(pipeline.context.variables.get('targetFile'))

  const url = new URL(endpoint)
  url.searchParams.append('graph', graph)

  const response = await fetch(url.toString(), {
    body,
    method,
    headers: {
      'content-type': 'application/n-triples',
      Authorization: `Basic ${Buffer.from(username + ':' + password).toString('base64')}`,
    },
  })

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}\n\n${await response.text()}`)
  }
}
