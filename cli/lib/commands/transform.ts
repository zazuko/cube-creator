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
  },
})
