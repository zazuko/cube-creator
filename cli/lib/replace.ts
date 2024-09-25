import through2 from 'through2'
import type { Quad } from '@rdfjs/types'
import $rdf from 'rdf-ext'

function replace(version: string) {
  const prefix = 'https://cube.link/latest/'
  const replacement = `https://cube.link/${version}/`
  return through2.obj(function (quad: Quad, _, done) {
    if (quad.predicate.value === 'https://code.described.at/imports' && quad.object.value.startsWith(prefix)) {
      const replaced = quad.object.value.replace(prefix, replacement)
      const triple = $rdf.triple(quad.subject, quad.predicate, $rdf.namedNode(replaced))
      done(null, triple)
    } else {
      done(null, quad)
    }
  })
}

export default replace
