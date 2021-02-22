import { schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'
import $rdf from 'rdf-ext'

export default (): Initializer<NodeShape> => ({
  closed: true,
  property: [{
    path: schema.name,
    uniqueLang: true,
    minCount: 1,
    maxCount: 4,
    languageIn: supportedLanguages,
    order: 10,
  }, {
    path: schema.validFrom,
    maxCount: 1,
    datatype: xsd.dateTime,
    defaultValue: $rdf.literal(new Date().toISOString(), xsd.dateTime),
    order: 20,
  }, {
    path: sh.property,
    minCount: 1,
    maxCount: 1,
    nodeKind: sh.BlankNode,
    defaultValue: $rdf.blankNode(),
    order: 30,
    node: {
      property: [{
        path: schema.name,
        uniqueLang: true,
        maxCount: 4,
        languageIn: supportedLanguages,
        order: 10,
      }],
    },
  }],
})
