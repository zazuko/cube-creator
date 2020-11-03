import { URLSearchParams } from 'url'
import { NamedNode } from 'rdf-js'
import fetch from 'node-fetch'
import env from '@cube-creator/core/env'

const pipelineURI = env.PIPELINE_URI

export async function triggerPipeline(job: NamedNode): Promise<void> {
  switch (env.PIPELINE_TYPE) {
    case 'local':
      triggerLocalPipeline(job)
      break
    case 'github':
    case 'gitlab':
      throw new Error('Not implemented')
  }
}

async function triggerLocalPipeline(job: NamedNode): Promise<void> {
  if (!job) {
    throw new Error('Job URI missing')
  }
  const form = new URLSearchParams({
    JOB_URI: job.value,
  })

  const res = await fetch(pipelineURI, {
    method: 'POST',
    body: form,
  })

  if (res.status !== 201) {
    const message = await res.text()
    throw new Error(`Pipeline failed: ${message}`)
  }
}
