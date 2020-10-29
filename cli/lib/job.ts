import stream from 'readable-stream'
import { Hydra } from 'alcaeus/node'
import { Job, Table } from '@cube-creator/model'
import * as Csvw from '@rdfine/csvw'
import * as Models from '@cube-creator/model'

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(...Object.values(Csvw))

interface Params {
  jobUri: string
  log: Record<string, (msg: string) => void>
  variables: Map<string, string>
}

async function loadJob(jobUri: string, log: Params['log'], variables: Params['variables']): Promise<Job> {
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

async function loadTables(job: Job, log: any): Promise<Table[]> {
  if (job.tableCollection.load) {
    log.info(`Will transform project ${job.label}`)
    const { representation } = await job.tableCollection.load()

    if (representation?.root) {
      return representation?.root.member
    }
  }

  log.warn('Tables not found for project')
  return []
}

export class JobIterator extends stream.Readable {
  constructor({ jobUri, log, variables }: Params) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    loadJob(jobUri, log, variables)
      .then(job => loadTables(job, log))
      .then(tables => {
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

              this.push(csvwResource)
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
