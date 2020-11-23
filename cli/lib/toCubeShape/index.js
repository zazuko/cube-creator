import clownface from 'clownface'
import TermMap from '@rdfjs/term-map'
import TermSet from '@rdfjs/term-set'
import rdf from 'rdf-ext'
import { Transform } from 'readable-stream'
import { urlJoin } from './urlJoin'
import { Cube } from './Cube'
import * as ns from '@tpluscode/rdf-ns-builders'
import { cube } from '@cube-creator/core/namespace'

function defaultCube({ observationSet }) {
  const observationSetIri = observationSet && observationSet.value

  if (!observationSetIri) {
    return null
  }

  const cubeIri = urlJoin(observationSetIri, '..')

  return rdf.namedNode(cubeIri)
}

function defaultShape({ term }) {
  const cubeIri = term && term.value

  if (!cubeIri) {
    return null
  }

  const shapeIri = urlJoin(cubeIri, 'shape/')

  return rdf.namedNode(shapeIri)
}

class ToCubeShape extends Transform {
  constructor({ cube, excludeValuesOf } = {}) {
    super({ objectMode: true })

    this.options = {
      cubes: new TermMap(),
      cube: cube || defaultCube,
      shape: defaultShape,
      excludeValuesOf: new TermSet(excludeValuesOf ? excludeValuesOf.map(v => rdf.namedNode(v)) : []),
    }
  }

  _transform(chunk, encoding, callback) {
    const dataset = rdf.dataset([...chunk])

    const context = {
      dataset,
      ptr: clownface({ dataset }).has(ns.rdf.type, cube.Observation),
    }

    context.observationSet = context.ptr.in(cube.observation).term
    context.term = this.options.cube(context)
    context.shape = this.options.shape(context)
    context.cube = this.options.cubes.get(context.term)

    if (!context.cube) {
      context.cube = new Cube({
        term: context.term,
        observationSet: context.observationSet,
        shape: context.shape,
      })

      this.options.cubes.set(context.term, context.cube)
    }

    for (const quad of context.dataset.match(context.ptr.term)) {
      if (!this.options.excludeValuesOf.has(quad.predicate)) {
        context.cube.update(quad)
      }
    }

    callback(null, context.dataset.toArray())
  }

  _flush(callback) {
    for (const cube of this.options.cubes.values()) {
      this.push(cube.toDataset())
    }

    callback()
  }
}

export default function toCubeShape({ cube, excludeValuesOf } = {}) {
  return new ToCubeShape({ cube, excludeValuesOf })
}
