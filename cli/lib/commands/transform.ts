import * as Csvw from '@rdfine/csvw'
import { ThingMixin } from '@rdfine/schema'
import * as runner from './runner.js'

interface TransformRunOptions extends runner.RunOptions {
  to: 'stdout' | 'filesystem' | 'graph-store'
}

export default runner.create<TransformRunOptions>({
  pipelineSources(command) {
    const { to } = command
    return ['main', 'from-api', `to-${to}`, 'validate']
  },
  prepare(_, variable) {
    variable.set('lastTransformed', {})

    const Hydra = variable.get('apiClient')

    Hydra.resources.factory.addMixin(...Object.values(Csvw))
    Hydra.resources.factory.addMixin(ThingMixin)
  },
})
