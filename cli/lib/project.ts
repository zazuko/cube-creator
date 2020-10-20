import stream from 'readable-stream'
import { Hydra } from 'alcaeus/node'
import { Project, CsvSource } from '@cube-creator/model'
import * as Csvw from '@rdfine/csvw'
import type Logger from 'barnard59-core/lib/logger'
import type { Context } from 'barnard59-core/lib/Pipeline'

async function loadProject(projectUri, log) {
  log.debug(`Loading project ${projectUri}`)
  const { representation } = await Hydra.loadResource<Project>(projectUri)
  if (!representation || !representation.root) {
    throw new Error(`Did not find representation of project ${projectUri}`)
  }

  return representation.root
}

async function loadSources(project: Project, log: Logger): Promise<CsvSource[]> {
  if (!project.csvMapping || !project.csvMapping.load) {
    log.warn('CSV Mapping resource not found. Is this a CSV mapping project?')
    return []
  }

  log.info(`Will transform project ${project.label}`)
  return project.csvMapping.sources
}

class ProjectIterator extends stream.Readable {
  constructor(projectUri: string, log: Logger) {
    super({
      objectMode: true,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read: () => {},
    })

    loadProject(projectUri, log)
      .then(project => loadSources(project, log))
      .then(sources => {
        const loadMetadata = sources.reduce((metadata, table) => {
          log.debug(`Loading csvw for sources ${table.name}`)
          const promise = table.csvw.load!<Csvw.Table>()
            .then(({ representation }) => representation?.root)
            .then((csvwResource) => {
              if (!csvwResource) {
                log.warn(`Skipping table ${table.name}. Failed to dereference`)
                return
              }

              if (!csvwResource.url) {
                log.warn(`Skipping table ${table.name}. Missing csvw:url property`)
                return
              }

              if (!csvwResource.dialect) {
                log.warn(`Skipping table ${table.name}. CSV dialect not set`)
                return
              }

              log.debug(`Will transform table ${table.name} from ${csvwResource.url}. Dialect: delimiter=${csvwResource.dialect.delimiter} quote=${csvwResource.dialect.quoteChar}`)

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

export function loadCsvMappings(this: Context, projectUri: string) {
  return new ProjectIterator(projectUri, this.log)
}
