import { xsd } from '@tpluscode/rdf-ns-builders/strict'
import { NamedNode } from 'rdf-js'

export const datatypes: [NamedNode, string[]][] = [
  // Most used datatypes, in alphabetical order of the label
  [xsd.string, ['string']],
  [xsd.boolean, ['boolean']],
  [xsd.integer, ['int']],
  [xsd.decimal, ['decimal']],
  [xsd.time, ['time']],
  [xsd.date, ['date']],
  [xsd.dateTime, ['datetime']],
  // [xsd.float, ['float']],
  // Less used datatypes, in alphabetical order of the label
  [xsd.gDay, ['day']],
  // [xsd.duration, ['duration']],
  // [xsd.dayTimeDuration, ['duration (day+time)']],
  // [xsd.yearMonthDuration, ['duration (year+month)']],
  [xsd.gMonth, ['month']],
  // [xsd.gMonthDay, ['month+day']],
  [xsd.gYear, ['year']],
  // [xsd.gYearMonth, ['year+month']],
]
