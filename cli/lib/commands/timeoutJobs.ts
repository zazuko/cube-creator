import { SELECT } from '@tpluscode/sparql-builder'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders/strict'
import * as Alcaeus from 'alcaeus/node'
import { cc } from '@cube-creator/core/namespace'
import * as Models from '@cube-creator/model'
import { parse, toSeconds } from 'iso8601-duration'
import { toRdf } from 'rdf-literal'
import { updateJobStatus } from '../job'
import { setupAuthentication } from '../auth'
import { log } from '../log'

interface TimeoutJobs {
  duration: string
  now?(): number
  updateJob?: typeof updateJobStatus
}

export async function timeoutJobs({
  duration,
  now = Date.now,
  updateJob = updateJobStatus,
}: TimeoutJobs): Promise<void> {
  log.enabled = true

  const client = new ParsingClient({
    endpointUrl: process.env.GRAPH_QUERY_ENDPOINT!,
    user: process.env.GRAPH_STORE_USER,
    password: process.env.GRAPH_STORE_PASSWORD,
  })

  const timeout = toSeconds(parse(duration))
  const startDate = new Date(now() - (timeout * 1000))

  log('Will expire jobs active since before %s', startDate.toISOString())

  const overtimeJobs = await SELECT`?job`
    .WHERE`
      graph ?job {
        ?job a ${cc.Job} .
        ?job ${schema.actionStatus} ${schema.ActiveActionStatus} .
        ?job ${dcterms.modified} ?modified .

        filter (
          ?modified < ${toRdf(startDate)}
        )
      }
    `
    .execute(client.query)

  const apiClient = Alcaeus.create()
  apiClient.resources.factory.addMixin(...Object.values(Models))
  setupAuthentication({}, log, apiClient)

  const updateRequests = overtimeJobs
    .map(({ job }) => updateJob({
      jobUri: job.value,
      apiClient,
      modified: new Date(now()),
      status: schema.FailedActionStatus,
      executionUrl: undefined,
      error: 'Job exceeded maximum running time',
    }).then(() => {
      log('Updated job %s', job.value)
    }).catch(log))

  await Promise.all(updateRequests)
}
