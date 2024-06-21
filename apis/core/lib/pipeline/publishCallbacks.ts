import env from '@cube-creator/core/env/node'
import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { warning } from '../log.js'
import { TriggerCallbackMap, TriggerCallbacks } from './index.js'

const pipelineUrlTerm = $rdf.namedNode('urn:gitlab:pipelineUrl')

const gitlab: TriggerCallbacks = {
  onSuccess: async function cancelConcurrentJobs({ job, res, client }) {
    if (!env.has('GITLAB_TOKEN') || !env.has('GITLAB_API_URL')) {
      return
    }

    const { project_id: gitlabProject, id: gitlabPipeline } = await res.json()
    const pipelineUrl = `${env.GITLAB_API_URL}/projects/${gitlabProject}/pipelines/${gitlabPipeline}`
    job.addOut(pipelineUrlTerm, job.namedNode(pipelineUrl))

    const previousJobs = await SELECT`?pipelineUrl`
      .WHERE`
        graph ?job {
          ?job a ${cc.PublishJob} ;
               ${pipelineUrlTerm} ?pipelineUrl ;
               ${cc.project} ${job.out(cc.project).term} ;
               ${schema.actionStatus} ?status ;
               ${cc.revision} ${job.out(cc.revision).term} ;
          .
        }
      `.execute(client)

    const cancelPipelines = previousJobs.map(async ({ pipelineUrl }) => {
      return fetch(`${pipelineUrl.value}/cancel`, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': env.GITLAB_TOKEN,
        },
      }).catch(warning)
    })

    await Promise.all(cancelPipelines)
  },
}

export const callbacks: TriggerCallbackMap = {
  gitlab,
}
