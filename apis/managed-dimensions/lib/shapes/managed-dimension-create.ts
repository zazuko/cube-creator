import { meta } from '@cube-creator/core/namespace'
import { rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'

export default (): Initializer<NodeShape> => ({
  closed: true,
  property: [{
    path: rdf.type,
    hasValue: [
      schema.DefinedTermSet,
      meta.SharedDimension,
    ],
    minCount: 2,
    maxCount: 2,
    hidden: true,
  }, {
    path: schema.name,
    uniqueLang: true,
    maxCount: 4,
    languageIn: supportedLanguages,
    order: 10,
  }, {
    path: schema.validFrom,
    maxCount: 1,
    datatype: xsd.dateTime,
    defaultValue: new Date(),
    order: 20,
  }, {
    path: sh.property,
    minCount: 1,
    maxCount: 1,
    nodeKind: sh.BlankNode,
    defaultValue: {},
    order: 30,
    node: [{
      property: [{
        path: schema.name,
        uniqueLang: true,
        maxCount: 4,
        languageIn: supportedLanguages,
        order: 10,
      }],
    }],
  }],
})
