import clownface from 'clownface'
import * as ns from '@tpluscode/rdf-ns-builders'
import rdf from 'rdf-ext'
import TermMap from '@rdfjs/term-map'
import Dimension from './Dimension'
import { cube } from '@cube-creator/core/namespace'

export class Cube {
  constructor({ term, observationSet, shape }) {
    this.term = term
    this.observationSet = observationSet
    this.shape = shape
    this.dimensions = new TermMap()
  }

  dimension({ predicate, object }) {
    let dimension = this.dimensions.get(predicate)

    if (!dimension) {
      dimension = new Dimension({ predicate, object })

      this.dimensions.set(predicate, dimension)
    }

    return dimension
  }

  update({ predicate, object }) {
    this.dimension({ predicate, object }).update({ predicate, object })
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
