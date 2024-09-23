import * as Csvw from '@rdfine/csvw'
import { ThingMixin } from '@rdfine/schema'
import { Project, TransformJob } from '@cube-creator/model'
import { cube } from '@cube-creator/core/namespace'
import * as runner from './runner'

interface TransformRunOptions extends runner.RunOptions {
  to: 'stdout' | 'filesystem' | 'graph-store'
}

export default runner.create<TransformRunOptions>({
  pipelineSources(command) {
    const { to } = command
    return ['main', 'from-api', `to-${to}`, 'validate']
  },
  async prepare(options, variable) {
    const Hydra = variable.get('apiClient')

    const jobResource = await Hydra.loadResource<TransformJob>(options.job)
    const job = jobResource.representation?.root
    if (!job) {
      throw new Error(`Did not find representation of job ${options.job}. Server responded ${jobResource.response?.xhr.status}`)
    }

    const projectResource = await Hydra.loadResource<Project>(job.project)
    const project = projectResource.representation?.root
    if (!project) {
      throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
    }
    const observer = project.maintainer.pointer.out(cube.observedBy).term
    variable.set('observer', observer?.value)
    variable.set('lastTransformed', {})

    Hydra.resources.factory.addMixin(...Object.values(Csvw))
    Hydra.resources.factory.addMixin(ThingMixin)
  },
})
