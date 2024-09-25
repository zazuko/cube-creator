import path from 'path'
import tempy from 'tempy'
import { HydraClient } from 'alcaeus/alcaeus'
import { CsvProject, Dataset, ImportProject, PublishJob } from '@cube-creator/model'
import '../variables'
import { isCsvProject } from '@cube-creator/model/Project'
import $rdf from 'rdf-ext'
import { logger } from '../log'
import { uploadCube } from '../publish/upload'
import { version } from '../../package.json'
import * as runner from './runner'

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
    const Hydra = variable.get('apiClient')

    const { job, namespace, cubeIdentifier, cubeCreatorVersion, profile } = await getJob(jobUri, Hydra)

    if (options.to === 'filesystem' && !variable.has('targetFile')) {
      variable.set('targetFile', tempy.file())
    }

    variable.set('publish-job', job)
    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-query-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_QUERY_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)
    variable.set('metadata', $rdf.dataset())
    variable.set('shapesPath', path.resolve(__dirname, `../../${profile}.ttl`))
    variable.set('shapesVersion', 'v0.2.2')

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
  profile: string
}> {
  const jobResource = await Hydra.loadResource<PublishJob>(jobUri)
  const cubeCreatorVersion = jobResource.response?.xhr.headers.get('x-cube-creator')
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  type opendataswiss = 'https://ld.admin.ch/application/opendataswiss'
  type visualize = 'https://ld.admin.ch/application/visualize'
  type knownTarget = opendataswiss | visualize

  function isKnownTarget(value: string): value is knownTarget {
    return value === 'https://ld.admin.ch/application/opendataswiss' ||
      value === 'https://ld.admin.ch/application/visualize'
  }

  const getProfileURL = (target: knownTarget) => {
    switch (target) {
      case 'https://ld.admin.ch/application/opendataswiss':
        return 'shapes-opendataswiss'
      case 'https://ld.admin.ch/application/visualize':
        return 'shapes-visualize'
    }
  }

  const getProfile = () => {
    const publishedTo = jobResource.representation?.root?.publishedTo ?? []
    const found = publishedTo
      .map(target => target.value)
      .filter(isKnownTarget)
      .map(getProfileURL)
    if (found.length === 1) return found[0]
    if (found.length === 2) {
      return 'shapes-all'
    }

    return 'shapes-default'
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
    profile: getProfile(),
  }
}
