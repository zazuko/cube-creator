const clownface = require('clownface')
const TermMap = require('@rdfjs/term-map')
const TermSet = require('@rdfjs/term-set')
const rdf = require('rdf-ext')
const { Transform } = require('readable-stream')
const ns = require('@tpluscode/rdf-ns-builders')
const { cube } = require('@cube-creator/core/namespace')
const urlJoin = require('./urlJoin')
const Cube = require('./Cube')

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
  constructor({ cube, excludeValuesOf, inListThreshold } = {}) {
    super({ objectMode: true })

    this.options = {
      cubes: new TermMap(),
      cube: cube || defaultCube,
      shape: defaultShape,
      excludeValuesOf: new TermSet(excludeValuesOf ? excludeValuesOf.map(v => rdf.namedNode(v)) : []),
      inListThreshold,
    }
  }

  _transform(chunk, encoding, callback) {
    const dataset = rdf.dataset([...chunk])

    const context = {
      dataset,
      ptr: $rdf.clownface({ dataset }).has(ns.rdf.type, cube.Observation),
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
        context.cube.update(quad, { inListThreshold: this.options.inListThreshold })
      }
    }

    callback(null, context.dataset.toArray())
  }

  _flush(callback) {
    for (const cube of this.options.cubes.values()) {
      this.push(cube.toDataset())
      for (const message of cube.messages) {
        this.emit('message', message)
      }
    }

    callback()
  }
}

function toCubeShape({ cube, excludeValuesOf, inListThreshold = 100 } = {}) {
  const toCubeShape = new ToCubeShape({ cube, excludeValuesOf, inListThreshold })
  toCubeShape.on('message', message => this.variables.get('messages').push(message))
  return toCubeShape
}

module.exports = toCubeShape
