import { dash, dcterms, hydra, qudt, rdf, rdfs, schema, sh, time, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { supportedLanguages } from '@cube-creator/core/languages'
import { datatypes } from '@cube-creator/core/datatypes'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import { fromPointer as iriTemplate } from '@rdfine/hydra/lib/IriTemplate'
import type { NodeShape, PropertyShape } from '@rdfine/shacl'
import $rdf from 'rdf-ext'
import { editor, iso6391, md, meta, sh1 } from '@cube-creator/core/namespace'
import { fromPointer as nodeShape } from '@rdfine/shacl/lib/NodeShape'
import { fromPointer as propertyGroup } from '@rdfine/shacl/lib/PropertyGroup'
import { fromPointer as resource } from '@rdfine/rdfs/lib/Resource'
import { dcat, owl } from '@tpluscode/rdf-ns-builders'

const defaultGroup = $rdf.namedNode('#default-group')
const i14yGroup = $rdf.namedNode('#i14y-group')
const datatypeUri = [xsd.anyURI, ['URI']]

const commonProperties = [
  hydra.required,
  rdf.predicate,
  rdfs.label,
  schema.multipleValues,
]

const i14yProperties = [{
  name: 'Identifier',
  path: schema.identifier,
  order: 10,
  datatype: xsd.string,
  maxCount: 1,
  group: propertyGroup(i14yGroup, {
    label: 'I14Y',
  }),
}, {
  name: 'Version',
  path: schema.version,
  order: 20,
  datatype: xsd.string,
  maxCount: 1,
  pattern: '^\\d+(\\.\\d+(\\.\\d+)?)?$',
  group: i14yGroup,
  message: 'Version must be one of the formats: x, x.y, x.y.z',
}, {
  name: 'Themes',
  path: dcat.theme,
  order: 30,
  nodeKind: sh.IRI,
  editor: dash.URIEditor,
  group: i14yGroup,
}, {
  name: 'Keywords',
  path: dcat.keyword,
  order: 40,
  nodeKind: sh.Literal,
  group: i14yGroup,
}, {
  name: 'Conforms to',
  path: dcterms.conformsTo,
  order: 50,
  nodeKind: sh.IRI,
  editor: dash.URIEditor,
  group: i14yGroup,
}]

const properties: Initializer<PropertyShape>[] = [{
  name: 'Name',
  path: schema.name,
  uniqueLang: true,
  minCount: 1,
  maxCount: supportedLanguages.length,
  languageIn: supportedLanguages,
  order: 10,
  group: propertyGroup(defaultGroup, {
    label: 'Dimension',
  }),
}, {
  name: 'Abbreviation',
  path: schema.alternateName,
  languageIn: supportedLanguages,
  maxCount: supportedLanguages.length,
  uniqueLang: true,
  order: 15,
  group: defaultGroup,
}, {
  name: 'Valid from',
  path: schema.validFrom,
  maxCount: 1,
  datatype: xsd.dateTime,
  defaultValue: $rdf.literal(new Date().toISOString(), xsd.dateTime),
  order: 20,
  group: defaultGroup,
}, {
  name: 'Valid to',
  path: schema.validThrough,
  maxCount: 1,
  datatype: xsd.dateTime,
  order: 25,
  group: defaultGroup,
}, {
  name: 'Default metadata',
  description: "Metadata copied to cube's metadata when this dimension is selected",
  path: sh.property,
  minCount: 1,
  maxCount: 1,
  nodeKind: sh.BlankNodeOrIRI,
  defaultValue: $rdf.blankNode(),
  order: 30,
  group: defaultGroup,
  node: {
    property: [{
      name: 'Name',
      path: schema.name,
      uniqueLang: true,
      maxCount: 4,
      languageIn: supportedLanguages,
      order: 10,
    }, {
      name: 'Scale type',
      path: qudt.scaleType,
      in: [
        {
          id: qudt.NominalScale,
          types: [rdfs.Resource],
          label: $rdf.literal('Nominal', 'en'),
        },
        {
          id: qudt.OrdinalScale,
          types: [rdfs.Resource],
          label: $rdf.literal('Ordinal', 'en'),
        },
      ],
      maxCount: 1,
      defaultValue: qudt.NominalScale,
      order: 20,
    }, {
      name: 'Data kind',
      path: meta.dataKind,
      maxCount: 1,
      nodeKind: sh.BlankNodeOrIRI,
      order: 30,
      node: {
        property: [{
          name: 'Choose type',
          path: rdf.type,
          minCount: 1,
          maxCount: 1,
          nodeKind: sh.IRI,
          [dash.editor.value]: dash.EnumSelectEditor,
          in: [
            {
              id: schema.GeoCoordinates,
              types: [rdfs.Resource],
              label: $rdf.literal('Geographic coordinates', 'en'),
            },
            {
              id: schema.GeoShape,
              types: [rdfs.Resource],
              label: $rdf.literal('Geographic shape', 'en'),
            },
            {
              id: time.GeneralDateTimeDescription,
              types: [rdfs.Resource],
              label: $rdf.literal('Time description', 'en'),
            },
          ],
          order: 10,

        }, {
          name: 'Time precision',
          path: time.unitType,
          maxCount: 1,
          order: 20,
          nodeKind: sh.IRI,
          [sh1.if.value]: {
            [sh.path.value]: rdf.type,
            [sh.hasValue.value]: time.GeneralDateTimeDescription,
          },
          in: [
            {
              id: time.unitYear,
              types: [rdfs.Resource],
              label: $rdf.literal('Year', 'en'),
            },
            {
              id: time.unitMonth,
              types: [rdfs.Resource],
              label: $rdf.literal('Month', 'en'),
            },
            {
              id: time.unitWeek,
              types: [rdfs.Resource],
              label: $rdf.literal('Week', 'en'),
            },
            {
              id: time.unitDay,
              types: [rdfs.Resource],
              label: $rdf.literal('Day', 'en'),
            },
            {
              id: time.unitHour,
              types: [rdfs.Resource],
              label: $rdf.literal('Hour', 'en'),
            },
            {
              id: time.unitMinute,
              types: [rdfs.Resource],
              label: $rdf.literal('Minute', 'en'),
            },
            {
              id: time.unitSecond,
              types: [rdfs.Resource],
              label: $rdf.literal('Second', 'en'),
            },
          ],
        }],
      },
    }],
  },
}, {
  name: 'Term properties',
  description: 'Additional properties for Shared Terms',
  path: schema.additionalProperty,
  order: 40,
  nodeKind: sh.BlankNodeOrIRI,
  group: propertyGroup({
    label: 'Term properties',
  }),
  node: {
    [sh1.xoneDiscriminator.value]: md.dynamicPropertyType,
    property: [{
      name: 'Name',
      path: rdfs.label,
      minCount: 1,
      maxCount: 1,
      order: 5,
    }, {
      name: 'Predicate',
      path: rdf.predicate,
      minCount: 1,
      maxCount: 1,
      nodeKind: sh.IRI,
      [dash.editor.value]: editor.PropertyEditor,
      order: 10,
    }, {
      name: 'Value type',
      path: md.dynamicPropertyType,
      minCount: 1,
      maxCount: 1,
      in: [
        'Literal',
        'Shared Term',
        'Lang String',
      ],
      order: 20,
    }, {
      name: 'Required',
      path: hydra.required,
      minCount: 1,
      maxCount: 1,
      datatype: xsd.boolean,
      defaultValue: false,
      order: 15,
    }, {
      name: 'Allow multiple',
      path: schema.multipleValues,
      minCount: 1,
      maxCount: 1,
      datatype: xsd.boolean,
      defaultValue: false,
      order: 15,
    }],
    xone: [nodeShape({
      closed: true,
      ignoredProperties: commonProperties,
      property: [{
        path: md.dynamicPropertyType,
        hasValue: 'Literal',
        [dash.hidden.value]: true,
      }, {
        name: 'Data type',
        path: sh.datatype,
        in: [...datatypes, datatypeUri].map(([id, labels]) => ({
          id,
          [rdfs.label.value]: labels,
        })),
        minCount: 1,
        maxCount: 1,
        nodeKind: sh.IRI,
        order: 30,
        message: 'Datatype must be one of the listed xsd types',
      }],
    }), nodeShape({
      closed: true,
      ignoredProperties: commonProperties,
      property: [{
        path: md.dynamicPropertyType,
        hasValue: 'Shared Term',
        [dash.hidden.value]: true,
      }, {
        name: 'Shared dimension',
        path: sh.class,
        [dash.editor.value]: dash.AutoCompleteEditor,
        [hydra.search.value]: iriTemplate({
          template: '/dimension/_term-sets{?q}',
          mapping: {
            variable: 'q',
            property: hydra.freetextQuery,
            [sh.minLength.value]: 0,
          },
        }),
        nodeKind: sh.IRI,
        minCount: 1,
        maxCount: 1,
        order: 30,
      }],
    }), nodeShape({
      closed: true,
      ignoredProperties: commonProperties,
      property: [{
        path: md.dynamicPropertyType,
        hasValue: 'Lang String',
        [dash.hidden.value]: true,
      }, {
        name: 'Languages',
        path: sh.languageIn,
        in: [resource(iso6391.de, {
          label: 'German',
        }), resource(iso6391.fr, {
          label: 'French',
        }), resource(iso6391.it, {
          label: 'Italian',
        }), resource(iso6391.rm, {
          label: 'Romansh',
        }), resource(iso6391.en, {
          label: 'English',
        })],
        [dash.editor.value]: editor.CheckboxListEditor,
        order: 30,
      }],
    })],
  },
}, {
  name: 'Contributors',
  description: 'Currently logged-in user will be used, if not set',
  path: dcterms.contributor,
  order: 50,
  nodeKind: sh.BlankNode,
  group: propertyGroup({
    label: 'Contributors',
  }),
  node: {
    property: [{
      name: 'Name',
      path: schema.name,
      minCount: 1,
      maxCount: 1,
    }, {
      name: 'Email',
      path: schema.email,
      minCount: 1,
      maxCount: 1,
    }],
  },
}, ...i14yProperties]

export const create = (): Initializer<NodeShape> => ({
  [sh1.xoneDiscriminator.value]: md.createAs,
  property: {
    path: md.createAs,
    minCount: 1,
    maxCount: 1,
    in: ['New dimension', 'Import'],
    defaultValue: 'New dimension',
    group: defaultGroup,
  },
  xone: [{
    closed: true,
    types: [sh.NodeShape],
    ignoredProperties: [
      sh.property,
    ],
    property: [{
      path: md.createAs,
      hasValue: 'Import',
      [dash.hidden.value]: true,
      group: defaultGroup,
    }, {
      name: 'Exported dimension',
      path: md.export,
      minCount: 1,
      maxCount: 1,
      order: 5,
      [dash.editor.value]: editor.FileUpload,
      group: defaultGroup,
    }],
  }, {
    closed: true,
    property: [{
      path: md.createAs,
      hasValue: 'New dimension',
      [dash.hidden.value]: true,
      group: defaultGroup,
    }, {
      name: 'Identifier',
      description: 'An alphanumeric value which identifies a shared dimension',
      path: dcterms.identifier,
      order: 0,
      pattern: '^[a-zA-Z0-9-_]+$',
      minCount: 1,
      maxCount: 1,
      group: defaultGroup,
    }, ...properties],
  }],
})

export const update = (): Initializer<NodeShape> => ({
  ignoredProperties: [
    dcterms.identifier,
    md.terms,
    md.export,
  ],
  property: [
    ...properties,
    {
      path: rdf.type,
      hasValue: [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension, md.SharedDimension],
      [dash.hidden.value]: true,
      group: defaultGroup,
    },
  ],
})

export const search = (): Initializer<NodeShape> => ({
  property: [
    {
      path: hydra.freetextQuery,
      name: 'Name',
      minCount: 1,
      maxCount: 1,
      order: 1,
    },
    {
      path: owl.deprecated,
      name: 'Show deprecated',
      minCount: 1,
      maxCount: 1,
      defaultValue: false,
      datatype: xsd.boolean,
      order: 2,
    },
  ],
})
