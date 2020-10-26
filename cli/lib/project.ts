import stream from 'readable-stream'
import { Hydra } from 'alcaeus/node'
import { Project, Table } from '@cube-creator/model'
import * as Csvw from '@rdfine/csvw'
import * as Models from '@cube-creator/model'

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(...Object.values(Csvw))

interface Params {
  projectUri: string
  log: Record<string, (msg: string) => void>
  variables: Map<string, string>
}

async function loadProject(projectUri: string, log: Params['log'], variables: Params['variables']): Promise<Project> {
  log.debug(`Loading project ${projectUri}`)
  const { representation, response } = await Hydra.loadResource<Project>(projectUri)
  if (!representation || !representation.root) {
    throw new Error(`Did not find representation of project ${projectUri}. Server responded ${response?.xhr.status}`)
  }

  if (!representation.root.cube) {
    throw new Error('Cannot transform project. Missing output cube id')
  }

  variables.set('graph', representation.root.cube.value)

  return representation.root
}

async function loadTables(project: Project, log: any): Promise<Table[]> {
  if (!project.csvMapping) {
    log.warn('CSV Mapping resource not found. Is this a CSV mapping project?')
    return []
  }

  if (project.csvMapping.tableCollection.load) {
    log.info(`Will transform project ${project.label}`)
    const { representation } = await project.csvMapping.tableCollection.load()

    if (representation?.root) {
      return representation?.root.member
    }
  }

  log.warn('Tables not found for project')
  return []
}

export class ProjectIterator extends stream.Readable {
  constructor({ projectUri, log, variables }: Params) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    loadProject(projectUri, log, variables)
      .then(project => loadTables(project, log))
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

export function loadCsvMappings(this: any, projectUri: string) {
  return new ProjectIterator({ projectUri, log: this.log, variables: this.variables })
}
