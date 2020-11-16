import { URLSearchParams } from 'url'
import { NamedNode } from 'rdf-js'
import nodeFetch, { RequestInit } from 'node-fetch'
import env from '@cube-creator/core/env'
import { GraphPointer } from 'clownface'
import { dcterms } from '@tpluscode/rdf-ns-builders'

const pipelineURI = env.PIPELINE_URI

function trigger(triggerRequestInit: (job: NamedNode, params: GraphPointer) => RequestInit) {
  return async (job: NamedNode, params: GraphPointer, fetch = nodeFetch) => {
    if (!job) {
      throw new Error('Job URI missing')
    }

    const res = await fetch(pipelineURI, triggerRequestInit(job, params))

    if (!res.ok) {
      const message = await res.text()
      throw new Error(`Pipeline failed: ${message}`)
    }
  }
}

export const local = trigger(job => {
  const form = new URLSearchParams({
    JOB_URI: job.value,
  })

  return {
    method: 'POST',
    body: form,
  }
})

export async function gitlab(job: NamedNode): Promise<void> {
  throw new Error('Not implemented')
}

export const github = trigger((job, params) => {
  const body = {
    ref: 'master',
    inputs: {
      job: job.value,
    },
  }

  return {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      accept: 'application/vnd.github.v3+json',
      authorization: `Bearer ${params.out(dcterms.identifier).value}`,
    },
  }
})
