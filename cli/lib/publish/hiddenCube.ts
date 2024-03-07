import type { Context } from 'barnard59-core/lib/Pipeline'
import $rdf from 'rdf-ext'
import through2 from 'through2'
import clownface from 'clownface'
import { cc } from '@cube-creator/core/namespace'

export function inject(this: Pick<Context, 'variables'>) {
  const isHiddenCube = this.variables.get('isHiddenCube')
  const cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')

  const cubeId = $rdf.namedNode(`${cubeNamespace}/${revision}`)

  const dataset = $rdf.dataset()
  clownface({ dataset })
    .node(cubeId)
    .addOut(cc.isHiddenCube, !!isHiddenCube)

  return through2.obj(
    (chunk, enc, cb) => cb(null, chunk),
    function (done) {
      dataset.forEach(this.push.bind(this))
      done()
    })
}
