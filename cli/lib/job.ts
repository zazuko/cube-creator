import stream from 'readable-stream'
import { Hydra } from 'alcaeus/node'
import { Job, Table } from '@cube-creator/model'
import * as Csvw from '@rdfine/csvw'
import * as Schema from '@rdfine/schema'
import * as Models from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'
import type Logger from 'barnard59-core/lib/logger'
import type { Context } from 'barnard59-core/lib/Pipeline'
import $rdf from 'rdf-ext'
import { names } from './variables'
import { ThingMixin } from '@rdfine/schema'

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(...Object.values(Csvw))
Hydra.resources.factory.addMixin(ThingMixin)

interface Params {
  jobUri: string
  log: Logger
  variables: Map<string, any>
}

async function loadJob(jobUri: string, log: Logger, variables: Params['variables']): Promise<Job> {
  log.debug(`Loading job ${jobUri}`)
  const { representation, response } = await Hydra.loadResource<Job>(jobUri)
  if (!representation || !representation.root) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${response?.xhr.status}`)
  }

  if (!representation.root.cubeGraph) {
    throw new Error('Cannot transform project. Missing output cube id')
  }

  variables.set('graph', representation.root.cubeGraph.value)

  return representation.root
}

interface JobStatusUpdate {
  jobUri: string
  executionUrl: string | undefined
  log: Logger
  status: Schema.ActionStatusType
  error?: Error
}

export async function updateJobStatus({ jobUri, executionUrl, log, status, error }: JobStatusUpdate) {
  try {
    const { representation } = await Hydra.loadResource<Job>(jobUri)
    const job = representation?.root
    if (!job) {
      log.error('Could not load job to update')
      return
    }

    const [operation] = job.findOperations({
      bySupportedOperation: schema.UpdateAction,
    })

    if (!operation) {
      log.warn('Could not find schema:UpdateAction operation on Job')
      return
    }

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

    log.info(`Updating job status to ${status.value}`)
    await operation.invoke(JSON.stringify(job.toJSON()), {
      'Content-Type': 'application/ld+json',
    })
  } catch (e) {
    log.warn(`Failed to update job status: ${e.message}`)
  }
}

async function loadTables(job: Job, log: Logger): Promise<Table[]> {
  if (job.tableCollection.load) {
    log.info(`Will transform project ${job.label}`)
    const { representation } = await job.tableCollection.load()

    if (representation?.root) {
      return representation?.root.member
    }
  }

  log.warn('Tables not found for job')
  return []
}

export class JobIterator extends stream.Readable {
  constructor({ jobUri, log, variables }: Params) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    Promise.resolve()
      .then(async () => {
        const job = await loadJob(jobUri, log, variables)
        await updateJobStatus({
          jobUri,
          executionUrl: variables.get(names.executionUrl),
          log,
          status: schema.ActiveActionStatus,
        })

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
  return new JobIterator({ jobUri, log: this.log, variables: this.variables })
}
