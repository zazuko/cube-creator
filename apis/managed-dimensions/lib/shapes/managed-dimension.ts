import { dash, qudt, rdf, schema, sh, time, xsd } from '@tpluscode/rdf-ns-builders'
import { supportedLanguages } from '@cube-creator/core/languages'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'
import $rdf from 'rdf-ext'
import { meta, sh1 } from '@cube-creator/core/namespace'

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
        name: 'Name',
        path: schema.name,
        uniqueLang: true,
        maxCount: 4,
        languageIn: supportedLanguages,
        order: 10,
      }, {
        name: 'Scale type',
        path: qudt.scaleType,
        in: [qudt.NominalScale, qudt.OrdinalScale],
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
            editor: dash.EnumSelectEditor,
            in: [
              schema.GeoCoordinates,
              schema.GeoShape,
              time.GeneralDateTimeDescription,
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
              time.unitYear,
              time.unitMonth,
              time.unitWeek,
              time.unitDay,
              time.unitHour,
              time.unitMinute,
              time.unitSecond,
            ],
          }],
        },
      }],
    },
  }],
})
