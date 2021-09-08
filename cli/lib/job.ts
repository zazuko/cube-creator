import stream from 'readable-stream'
import { HydraClient } from 'alcaeus/alcaeus'
import { Job, Table, TransformJob } from '@cube-creator/model'
import type * as Schema from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { Logger } from 'winston'
import type { Context, VariableMap } from 'barnard59-core/lib/Pipeline'
import $rdf from 'rdf-ext'
import { logger } from './log'

interface Params {
  jobUri: string
  logger: Logger
  variables: VariableMap
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
  error?: Error
  apiClient: HydraClient
}

export async function updateJobStatus({ jobUri, executionUrl, status, error, modified, apiClient }: JobStatusUpdate) {
  try {
    const { representation } = await apiClient.loadResource<Job>(jobUri)
    const job = representation?.root
    if (!job) {
      logger.error('Could not load job to update')
      return
    }

    const [operation] = job.findOperations({
      bySupportedOperation: schema.UpdateAction,
    })

    if (!operation) {
      logger.warn('Could not find schema:UpdateAction operation on Job')
      return
    }

    job.modified = modified
    job.actionStatus = status
    if (executionUrl) {
      job.seeAlso = $rdf.namedNode(executionUrl) as any
    }
    if (error) {
      job.error = {
        types: [schema.Thing],
        name: error.message,
        description: error.stack,
      } as any
    }

    logger.info(`Updating job status to ${status.value}`)
    await operation.invoke(JSON.stringify(job.toJSON()), {
      'Content-Type': 'application/ld+json',
    })
  } catch (e) {
    logger.error(`Failed to update job status: ${e.message}`)
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
  constructor({ jobUri, logger, variables }: Params) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    Promise.resolve()
      .then(async () => {
        const job = await loadTransformJob(jobUri, logger, variables)
        const tables = await loadTables(job, logger)

        const loadMetadata = tables.reduce((metadata, table) => {
          if (!table.csvw.load) {
            logger.warn(`Skipping table '${table.name}'. Is it dereferencable?`)
            return metadata
          }

          logger.debug(`Loading csvw for table '${table.name}'`)
          const promise = table.csvw.load()
            .then(({ representation }) => representation?.root)
            .then((csvwResource) => {
              if (!csvwResource) {
                logger.warn(`Skipping table '${table.name}'. Failed to dereference ${table.csvw.id.value}`)
                return
              }

              if (!csvwResource.url) {
                logger.warn(`Skipping table '${table.name}'. Missing csvw:url property`)
                return
              }

              if (!csvwResource.dialect) {
                logger.warn(`Skipping table '${table.name}'. CSV dialect not set`)
                return
              }

              logger.debug(`Will transform table '${table.name}' from ${csvwResource.url}. Dialect: delimiter=${csvwResource.dialect.delimiter} quote=${csvwResource.dialect.quoteChar}`)

              this.push({
                isObservationTable: table.isObservationTable,
                csvwResource,
              })
            })
            .catch(e => {
              logger.error(`Failed to load ${table.csvw.id.value}`)
              logger.error(e.message)
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
  return new TableIterator({ jobUri, logger: this.logger, variables: this.variables })
}
