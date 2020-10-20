import stream from 'readable-stream'
import { Hydra } from 'alcaeus/node'
import { Collection } from 'alcaeus'
import { Project, Table } from '@cube-creator/model'
import * as Csvw from '@rdfine/csvw'
import * as Models from '@cube-creator/model'

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(...Object.values(Csvw))

async function loadProject(projectUri: string, log: any): Promise<Project> {
  log.debug(`Loading project ${projectUri}`)
  const { representation, response } = await Hydra.loadResource<Project>(projectUri)
  if (!representation || !representation.root) {
    throw new Error(`Did not find representation of project ${projectUri}. Server responded ${response?.xhr.status}`)
  }

  return representation.root
}

async function loadTables(project: Project, log: any): Promise<Table[]> {
  if (!project.csvMapping) {
    log.warn('CSV Mapping resource not found. Is this a CSV mapping project?')
    return []
  }

  if (project.csvMapping.tables.load) {
    log.info(`Will transform project ${project.label}`)
    const { representation } = await project.csvMapping.tables.load<Collection<Table>>()

    if (representation?.root) {
      return representation?.root.member
    }
  }

  log.warn('Tables not found for project')
  return []
}

export class ProjectIterator extends stream.Readable {
  constructor(projectUri: string, log: any) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    loadProject(projectUri, log)
      .then(project => loadTables(project, log))
      .then(tables => {
        const loadMetadata = tables.reduce((metadata, table) => {
          log.debug(`Loading csvw for table '${table.name}'`)
          const promise = Hydra.loadResource<Csvw.Table>(table.csvw)
            .then(({ representation }) => representation?.root)
            .then((csvwResource) => {
              if (!csvwResource) {
                log.warn(`Skipping table '${table.name}'. Failed to dereference ${table.csvw.value}`)
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
              log.error(`Failed to load ${table.csvw.value}`)
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
  return new ProjectIterator(projectUri, this.log)
}
