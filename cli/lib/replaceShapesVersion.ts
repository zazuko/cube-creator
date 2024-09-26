import type { Quad } from '@rdfjs/types'
import { Context } from 'barnard59-core'

export default function replaceShapesVersion(this: Context, version = 'v0.2.2') {
  const prefix = 'https://cube.link/latest/'
  const replacement = `https://cube.link/${version}/`
  const { env } = this

  return async function * (stream: AsyncIterable<Quad>) {
    for await (const quad of stream) {
      if (quad.predicate.equals(env.ns.code.imports) && quad.object.value.startsWith(prefix)) {
        const replaced = quad.object.value.replace(prefix, replacement)
        yield env.quad(quad.subject, quad.predicate, env.namedNode(replaced))
      } else {
        yield quad
      }
    }
  }
}
