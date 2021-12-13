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
  constructor({ predicate, object }, { inListThreshold }) {
    this.predicate = predicate
    this.termType = object.termType
    this.datatypes = new TermSet()
    this.inListThreshold = inListThreshold
    this.messages = []

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
    } else {
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

    if (!this.min && !this.max && this.in) {
      if (this.in.size < this.inListThreshold) {
        ptr.addList(ns.sh.in, [...this.in.values()])
      } else {
        this.messages.push(`Dimension \`<${this.predicate.value}>\` contains ${this.in.size} unique values. At this size they will not be listed in cube's [code list](https://zazuko.github.io/rdf-cube-schema/#usage-of-code-lists) constraint. This may be a indication of a numeric or temporal dimension not mapped to its correct data type`)
      }
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
