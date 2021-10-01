import stream from 'readable-stream'
import { HydraClient } from 'alcaeus/alcaeus'
import { Job, Table, TransformJob } from '@cube-creator/model'
import type * as Schema from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import type Logger from 'barnard59-core/lib/logger'
import type { Context, Variables } from 'barnard59-core/lib/Pipeline'
import $rdf from 'rdf-ext'
import { log } from './log'

interface Params {
  jobUri: string
  log: Logger
  variables: Variables
}

async function loadTransformJob(jobUri: string, log: Logger, variables: Params['variables']): Promise<TransformJob> {
  log.debug(`Loading job ${jobUri}`)

  const Hydra = variables.get('apiClient')

  const { representation, response } = await Hydra.loadResource<TransformJob>(jobUri)
  if (!representation || !representation.root) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${response?.xhr.status}`)
  }

  if (!representation.root.cubeGraph) {
    throw new Error('Cannot transform project. Missing output cube id')
  }

  log.info(`Will write output triples to graph <${representation.root.cubeGraph.value}>`)
  variables.set('graph', representation.root.cubeGraph.value)

  return representation.root
}

interface JobStatusUpdate {
  jobUri: string
  executionUrl: string | undefined
  status: Schema.ActionStatusType
  modified: Date
  error?: Error | string
  apiClient: HydraClient
}

export async function updateJobStatus({ jobUri, executionUrl, status, error, modified, apiClient }: JobStatusUpdate) {
  try {
    const { representation } = await apiClient.loadResource<Job>(jobUri)
    const job = representation?.root
    if (!job) {
      log('Could not load job to update')
      return
    }

    const [operation] = job.findOperations({
      bySupportedOperation: schema.UpdateAction,
    })

    if (!operation) {
      log('Could not find schema:UpdateAction operation on Job')
      return
    }

    job.modified = modified
    job.actionStatus = status
    if (executionUrl) {
      job.seeAlso = $rdf.namedNode(executionUrl) as any
    }
    if (error) {
      const name = error instanceof Error ? error.name : error
      const description = error instanceof Error ? error.stack : ''

      job.error = {
        types: [schema.Thing],
        name,
        description,
      } as any
    }

    log(`Updating job status to ${status.value}`)
    await operation.invoke(JSON.stringify(job.toJSON()), {
      'Content-Type': 'application/ld+json',
    })
  } catch (e) {
    log(`Failed to update job status: ${e.message}`)
  }
}

async function loadTables(job: TransformJob, log: Logger): Promise<Table[]> {
  if (job.tableCollection.load) {
    log.info(`Will transform project ${job.name}`)
    const { representation } = await job.tableCollection.load()

    if (representation?.root) {
      return representation?.root.member
    }
  }

  log.warn('Tables not found for job')
  return []
}

export class TableIterator extends stream.Readable {
  constructor({ jobUri, log, variables }: Params) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    Promise.resolve()
      .then(async () => {
        const job = await loadTransformJob(jobUri, log, variables)
        const tables = await loadTables(job, log)

        const loadMetadata = tables.reduce((metadata, table) => {
          if (!table.csvw.load) {
            log.warn(`Skipping table '${table.name}'. Is it dereferencable?`)
            return metadata
          }

          log.debug(`Loading csvw for table '${table.name}'`)
          const promise = table.csvw.load()
            .then(({ representation }) => representation?.root)
            .then((csvwResource) => {
              if (!csvwResource) {
                log.warn(`Skipping table '${table.name}'. Failed to dereference ${table.csvw.id.value}`)
                return
              }

              if (!csvwResource.url) {
                log.warn(`Skipping table '${table.name}'. Missing csvw:url property`)
                return
              }

              if (!csvwResource.dialect) {
                log.warn(`Skipping table '${table.name}'. CSV dialect not set`)
                return
              }

              log.debug(`Will transform table '${table.name}' from ${csvwResource.url}. Dialect: delimiter=${csvwResource.dialect.delimiter} quote=${csvwResource.dialect.quoteChar}`)

              this.push({
                isObservationTable: table.isObservationTable,
                csvwResource,
              })
            })
            .catch(e => {
              log.error(`Failed to load ${table.csvw.id.value}`)
              log.error(e.message)
            })

          metadata.push(promise)

          return metadata
        }, [] as Promise<void>[])

        return Promise.all(loadMetadata)
      })
      .catch(e => this.emit('error', e))
      .finally(() => {
        this.push(null)
      })
  }
}

export function loadCsvMappings(this: Context, jobUri: string) {
  return new TableIterator({ jobUri, log: this.log, variables: this.variables })
}
