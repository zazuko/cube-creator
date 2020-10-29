import { URLSearchParams } from 'url'
import { NamedNode } from 'rdf-js'
// import fetch from 'node-fetch'
// import env from '@cube-creator/core/env'

export async function triggerPipeline(job: NamedNode) {
  if (!job) {
    throw new Error('Job URI missing')
  }
  const form = new URLSearchParams({
    JOB_URI: job.value,
  })

  return Promise.resolve(form)
  /*

  return fetch(env.PIPELINE_URI, {
    method: 'POST',
    body: form,
  })
  */
}
