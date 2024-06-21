import path from 'path'
import tempy from 'tempy'
import { HydraClient } from 'alcaeus/alcaeus'
import { CsvProject, Dataset, ImportProject, PublishJob } from '@cube-creator/model'
import { isCsvProject } from '@cube-creator/model/Project'
import $rdf from '@cube-creator/env'
import { logger } from '../log.js'
import { uploadCube } from '../publish/upload.js'
import { version } from '../../package.json'
import * as runner from './runner.js'
import '../variables.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

interface PublishRunOptions extends runner.RunOptions {
  to: 'filesystem' | 'graph-store'
  upload?: boolean
  publishStore?: {
    endpoint: string
    user: string
    password: string
  }
}

export default runner.create<PublishRunOptions>({
  pipelineSources(command) {
    const { to } = command
    return ['publish', `publish-to-${to}`]
  },
  async prepare(options, variable) {
    const { publishStore, job: jobUri } = options

    const { job, namespace, cubeIdentifier, cubeCreatorVersion } = await getJob(jobUri, $rdf.hydra)

    if (options.to === 'filesystem' && !variable.has('targetFile')) {
      variable.set('targetFile', tempy.file())
    }

    variable.set('publish-job', job)
    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-query-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_QUERY_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)
    variable.set('metadata', $rdf.dataset())
    // this should be possible as relative path in pipeline ttl but does not work
    variable.set('shapesPath', path.resolve(__dirname, '../../shapes.ttl'))

    if (cubeCreatorVersion) {
      variable.set('cubeCreatorVersion', cubeCreatorVersion)
    }
    variable.set('cliVersion', version)

    variable.set('target-graph', job.publishGraph.value)
    if (process.env.PUBLISH_GRAPH_OVERRIDE) {
      logger.info('Overriding target graph from PUBLISH_GRAPH_OVERRIDE')
      variable.set('target-graph', process.env.PUBLISH_GRAPH_OVERRIDE)
    }
    logger.info(`Publishing to graph <${variable.get('target-graph')}>`)

    variable.set('revision', job.revision)
    variable.set('namespace', namespace)
    variable.set('cubeIdentifier', cubeIdentifier)
    logger.info(`Publishing cube <${cubeIdentifier}>`)
  },
  async after(options, variables) {
    if (options.to === 'filesystem') {
      if (!options.upload) {
        logger.info('Skipping upload to store')
        return
      }
      await uploadCube(variables)
    }
  },
})

async function getJob(jobUri: string, Hydra: HydraClient): Promise<{
  job: PublishJob
  namespace: string
  cubeIdentifier: string
  cubeCreatorVersion: string | undefined | null
}> {
  const jobResource = await Hydra.loadResource<PublishJob>(jobUri)
  const cubeCreatorVersion = jobResource.response?.xhr.headers.get('x-cube-creator')
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  const projectResource = await Hydra.loadResource<CsvProject | ImportProject>(job.project)
  const project = projectResource.representation?.root
  if (!project) {
    throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
  }

  const datasetResource = await Hydra.loadResource<Dataset>(project.dataset.id as any, {
    Prefer: 'include-in-lists',
  })
  if (!datasetResource.representation?.root?.hasPart[0]) {
    throw new Error(`Can not determine target graph for job ${jobUri}`)
  }

  const cubeIdentifier = isCsvProject(project) ? project.cubeIdentifier : project.sourceCube.value

  return {
    job,
    namespace: datasetResource.representation?.root?.hasPart[0].id.value,
    cubeIdentifier,
    cubeCreatorVersion,
  }
}
