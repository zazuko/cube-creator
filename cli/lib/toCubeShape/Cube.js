const clownface = require('clownface')
const rdf = require('rdf-ext')
const TermMap = require('@rdfjs/term-map')
const Dimension = require('./Dimension')
const ns = require('@tpluscode/rdf-ns-builders')
const { cube } = require('@cube-creator/core/namespace')

class Cube {
  constructor({ term, observationSet, shape }) {
    this.term = term
    this.observationSet = observationSet
    this.shape = shape
    this.dimensions = new TermMap()
  }

  get messages() {
    return [...this.dimensions.values()].flatMap(({ messages }) => messages)
  }

  dimension({ predicate, object }, { inListThreshold }) {
    let dimension = this.dimensions.get(predicate)

    if (!dimension) {
      dimension = new Dimension({ predicate, object }, { inListThreshold })

      this.dimensions.set(predicate, dimension)
    }

    return dimension
  }

  update({ predicate, object }, { inListThreshold }) {
    this.dimension({ predicate, object }, { inListThreshold }).update({ predicate, object })
  }

  toDataset() {
    const dataset = rdf.dataset()

    clownface({ dataset, term: this.term })
      .addOut(ns.rdf.type, cube.Cube)
      .addOut(cube.observationSet, this.observationSet)
      .addOut(cube.observationConstraint, this.shape)

    clownface({ dataset, term: this.observationSet })
      .addOut(ns.rdf.type, cube.ObservationSet)

    clownface({ dataset, term: this.shape })
      .addOut(ns.rdf.type, [ns.sh.NodeShape, cube.Constraint])
      .addOut(ns.sh.closed, true)

    for (const dimension of this.dimensions.values()) {
      dataset.addAll(dimension.toDataset({ shape: this.shape }))
    }

    return dataset
  }
}

module.exports = Cube
