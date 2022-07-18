import { SELECT } from '@tpluscode/sparql-builder'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders/strict'
import * as Alcaeus from 'alcaeus/node'
import { cc } from '@cube-creator/core/namespace'
import * as Models from '@cube-creator/model'
import { parse, toSeconds } from 'iso8601-duration'
import $rdf from 'rdf-ext'
import { toRdf } from 'rdf-literal'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { updateJobStatus } from '../job'
import { setupAuthentication } from '../auth'
import { logger } from '../log'

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
  const client = new ParsingClient({
    endpointUrl: process.env.GRAPH_QUERY_ENDPOINT!,
    user: process.env.GRAPH_STORE_USER,
    password: process.env.GRAPH_STORE_PASSWORD,
  })

  const timeout = toSeconds(parse(duration))
  const startDate = new Date(now() - (timeout * 1000))

  logger.info('Will expire jobs active since before %s', startDate.toISOString())

  const overtimeJobs = await SELECT.DISTINCT`?job`
    .WHERE`
      graph ?job {
        ?job a ${cc.Job} .
        ?job ${schema.actionStatus} ?status .
        ?job ${dcterms.modified}|${dcterms.created} ?modified .

        filter ( ?status ${IN(schema.ActiveActionStatus, schema.PotentialActionStatus)} )
        filter (
          ?modified < ${toRdf(startDate)}
        )
      }
    `
    .execute(client.query)

  const apiClient = Alcaeus.create({ datasetFactory: $rdf.dataset })
  apiClient.resources.factory.addMixin(...Object.values(Models))
  setupAuthentication({}, logger, apiClient)

  for (const { job } of overtimeJobs) {
    await updateJob({
      jobUri: job.value,
      apiClient,
      modified: new Date(now()),
      status: cc.CanceledJobStatus,
      executionUrl: undefined,
      error: 'Job exceeded maximum running time',
    })
    logger.info('Updated job %s', job.value)
  }
}
