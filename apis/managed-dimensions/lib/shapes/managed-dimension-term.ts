import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { NodeShape, PropertyShape } from '@rdfine/shacl'
import { rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import { md } from '@cube-creator/core/namespace'

const commonProperties: Initializer<PropertyShape>[] = [{
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
}]

export const create = (): Initializer<NodeShape> => ({
  closed: true,
  property: commonProperties,
})

export const update = (): Initializer<NodeShape> => ({
  closed: true,
  property: [
    ...commonProperties,
    {
      path: rdf.type,
      hasValue: [schema.DefinedTerm, md.ManagedDimensionTerm],
      hidden: true,
    },
    {
      path: schema.inDefinedTermSet,
      minCount: 1,
      maxCount: 1,
    },
  ],
})
