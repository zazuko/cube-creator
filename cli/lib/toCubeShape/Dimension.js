import { cube } from '@cube-creator/core/namespace'

const clownface = require('clownface')
const rdf = require('rdf-ext')
const TermSet = require('@rdfjs/term-set')
const ns = require('@tpluscode/rdf-ns-builders')

const datatypeParsers = (datatype) => {
  switch (datatype?.value) {
    case ns.xsd.date.value:
    case ns.xsd.dateTime.value:
      return term => new Date(term.value)
    case ns.xsd.double.value:
    case ns.xsd.float.value:
    case ns.xsd.decimal.value:
      return term => parseFloat(term.value)
    case ns.xsd.integer.value:
    case ns.xsd.int.value:
    case ns.xsd.gDay.value:
    case ns.xsd.gMonth.value:
    case ns.xsd.gYear.value:
      return term => parseInt(term.value, 10)
  }
}

class Dimension {
  constructor({ predicate, object }) {
    this.predicate = predicate
    this.termType = object.termType
    this.datatypes = new TermSet()

    if (object.datatype) {
      this.datatypes.add(object.datatype)
    }

    if (datatypeParsers(object.datatype)) {
      const datatypeParser = datatypeParsers(object.datatype)

      const value = datatypeParser(object)

      this.min = object
      this.minValue = value
      this.max = object
      this.maxValue = value
    } else if (!object.datatype || !cube.Undefined.equals(object.datatype)) {
      this.in = new TermSet()
    }
  }

  update({ object }) {
    if (object.datatype) {
      this.datatypes.add(object.datatype)
    }

    if (datatypeParsers(object.datatype)) {
      const datatypeParser = datatypeParsers(object.datatype)

      const value = datatypeParser(object)

      if (!this.minValue || value < this.minValue) {
        this.min = object
        this.minValue = value
      }

      if (!this.maxValue || value > this.maxValue) {
        this.max = object
        this.maxValue = value
      }
    }

    if (this.in) {
      this.in.add(object)
    }
  }

  toDataset({ shape }) {
    const dataset = rdf.dataset()

    const ptr = clownface({ dataset }).blankNode()

    const nodeKind = this.termType === 'NamedNode' ? ns.sh.IRI : ns.sh.Literal
    ptr
      .addIn(ns.sh.property, shape)
      .addOut(ns.sh.path, this.predicate)
      .addOut(ns.sh.nodeKind, nodeKind)
      .addOut(ns.sh.minCount, 1)
      .addOut(ns.sh.maxCount, 1)

    const datatypes = [...this.datatypes]
    if (this.datatypes.size > 1) {
      ptr.addList(ns.sh.or, datatypes.map(dt => ptr.blankNode().addOut(ns.sh.datatype, dt)))
    } else if (this.datatypes.size === 1 && nodeKind.equals(ns.sh.Literal)) {
      ptr.addOut(ns.sh.datatype, datatypes[0])
    }

    if (this.in) {
      ptr.addList(ns.sh.in, [...this.in.values()])
    }

    if (this.min) {
      ptr.addOut(ns.sh.minInclusive, this.min)
    }

    if (this.max) {
      ptr.addOut(ns.sh.maxInclusive, this.max)
    }

    return dataset
  }
}

module.exports = Dimension
