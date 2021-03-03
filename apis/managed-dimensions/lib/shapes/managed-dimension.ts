import { dash, qudt, rdf, rdfs, schema, sh, time, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'
import $rdf from 'rdf-ext'
import { meta, sh1 } from '@cube-creator/core/namespace'

export default (): Initializer<NodeShape> => ({
  closed: true,
  property: [{
    name: 'Name',
    path: schema.name,
    uniqueLang: true,
    minCount: 1,
    maxCount: 4,
    languageIn: supportedLanguages,
    order: 10,
  }, {
    name: 'Valid from',
    path: schema.validFrom,
    maxCount: 1,
    datatype: xsd.dateTime,
    defaultValue: $rdf.literal(new Date().toISOString(), xsd.dateTime),
    order: 20,
  }, {
    name: 'Default metadata',
    description: "Metadata copied to cube's metadata when this dimension is selected",
    path: sh.property,
    minCount: 1,
    maxCount: 1,
    nodeKind: sh.BlankNode,
    defaultValue: $rdf.blankNode(),
    order: 30,
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
        nodeKind: sh.BlankNode,
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
  }],
})
