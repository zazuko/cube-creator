import { URLSearchParams } from 'url'
import nodeFetch, { RequestInit } from 'node-fetch'
import env from '@cube-creator/core/env'
import { GraphPointer } from 'clownface'
import { dcterms, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { NamedNode } from 'rdf-js'

const pipelineURI = env.PIPELINE_URI

function trigger(triggerRequestInit: (job: GraphPointer<NamedNode>, params: GraphPointer) => RequestInit) {
  return async (job: GraphPointer<NamedNode>, params: GraphPointer, fetch = nodeFetch) => {
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
  const form = new URLSearchParams()

  if (job.has(rdf.type, cc.TransformJob).values.length > 0) {
    form.append('TRANSFORM_JOB_URI', job.value)
  }
  if (job.has(rdf.type, cc.PublishJob).values.length > 0) {
    form.append('PUBLISH_JOB_URI', job.value)
  }

  return {
    method: 'POST',
    body: form,
  }
})

export const gitlab = trigger(job => {
  const form = new URLSearchParams({
    token: env.PIPELINE_TOKEN,
    ref: 'master',
    'variables[ENV]': env.PIPELINE_ENV,
  })

  if (job.has(rdf.type, cc.TransformJob).values.length > 0) {
    form.append('variables[TRANSFORM_JOB]', job.value)
  }
  if (job.has(rdf.type, cc.PublishJob).values.length > 0) {
    form.append('variables[PUBLISH_JOB]', job.value)
  }

  return {
    method: 'POST',
    body: form,
  }
})

export const github = trigger((job, params) => {
  const jobParam = job.has(rdf.type, cc.TransformJob).values.length > 0 ? 'transform_job' : 'publish_job'
  const body = {
    ref: 'master',
    inputs: {
      [jobParam]: job.value,
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
