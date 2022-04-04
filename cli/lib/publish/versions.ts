import type { Context } from 'barnard59-core/lib/Pipeline'
import $rdf from 'rdf-ext'
import through2 from 'through2'
import clownface from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

export function inject(this: Pick<Context, 'variables'>) {
  const cliVersion = this.variables.get('cliVersion')
  const apiVersion = this.variables.get('cubeCreatorVersion')
  const cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')

  const cubeId = $rdf.namedNode(`${cubeNamespace}/${revision}`)

  const dataset = $rdf.dataset()
  clownface({ dataset })
    .node(cubeId)
    .addOut(schema.actionApplication, api => {
      api.addOut(schema.name, 'cube-creator-api').addOut(schema.softwareVersion, apiVersion)
    })
    .addOut(schema.actionApplication, cli => {
      cli.addOut(schema.name, 'cube-creator-cli').addOut(schema.softwareVersion, cliVersion)
    })

  return through2.obj(
    (chunk, enc, cb) => cb(null, chunk),
    function (done) {
      dataset.forEach(this.push.bind(this))
      done()
    })
}
