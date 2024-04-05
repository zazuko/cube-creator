import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { NodeShape, PropertyShape } from '@rdfine/shacl'
import { dash, dcterms, rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import { md } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import { fromPointer as propertyGroup } from '@rdfine/shacl/lib/PropertyGroup'

const defaultGroup = $rdf.namedNode('#default-group')

const commonProperties: Initializer<PropertyShape>[] = [{
  name: 'Name',
  path: schema.name,
  languageIn: supportedLanguages,
  uniqueLang: true,
  order: 10,
  minCount: 1,
  group: propertyGroup(defaultGroup, {
    label: 'Term',
  }),
}, {
  name: 'Identifiers',
  path: schema.identifier,
  datatype: xsd.string,
  order: 20,
  group: defaultGroup,
}, {
  name: 'Valid from',
  description: 'Leave empty to inherit date from the dimension',
  path: schema.validFrom,
  datatype: xsd.dateTime,
  maxCount: 1,
  order: 30,
  group: defaultGroup,
}, {
  name: 'Valid through',
  description: 'Use this to deprecate a term',
  path: schema.validThrough,
  datatype: xsd.dateTime,
  maxCount: 1,
  order: 40,
  group: defaultGroup,
}]

export const create = (): Initializer<NodeShape> => ({
  closed: true,
  property: [
    ...commonProperties,
    {
      name: 'Identifier',
      description: 'An alphanumeric value which identifies a shared dimension term',
      path: dcterms.identifier,
      order: 0,
      pattern: '^[a-zA-Z0-9-_]+$',
      minCount: 1,
      maxCount: 1,
      group: defaultGroup,
    }],
})

export const update = (): Initializer<NodeShape> => ({
  property: [
    ...commonProperties,
    {
      path: rdf.type,
      hasValue: [schema.DefinedTerm, md.SharedDimensionTerm],
      [dash.hidden.value]: true,
      group: defaultGroup,
    },
    {
      path: schema.inDefinedTermSet,
      minCount: 1,
      maxCount: 1,
      [dash.hidden.value]: true,
      group: defaultGroup,
    },
  ],
})
