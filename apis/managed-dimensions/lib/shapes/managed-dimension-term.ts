import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { NodeShape } from '@rdfine/shacl'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'

export const create = (): Initializer<NodeShape> => ({
  closed: true,
  property: [{
    name: 'Name',
    path: schema.name,
    languageIn: supportedLanguages,
    uniqueLang: true,
    order: 10,
    minCount: 1,
  }, {
    name: 'Identifiers',
    path: schema.identifier,
    datatype: xsd.string,
    order: 20,
  }, {
    name: 'Valid from',
    description: 'Leave empty to inherit date from the dimension',
    path: schema.validFrom,
    datatype: xsd.dateTime,
    maxCount: 1,
    order: 30,
  }],
})
