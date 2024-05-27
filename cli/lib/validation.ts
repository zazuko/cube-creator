import type { Literal, NamedNode, Quad } from '@rdfjs/types'
import { turtle } from '@tpluscode/rdf-string'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { validateQuad } from 'rdf-validate-datatype'
import TermMap from '@rdfjs/term-map'
import { xsd } from '@tpluscode/rdf-ns-builders'

export function validate(this: Context, quad: Quad): Quad {
  if (!validateQuad(quad)) {
    throw new Error(`${errorMessage(quad)}\n\n${quadToString(quad)}`)
  }

  return quad
}

function quadToString(quad: Quad): string {
  return turtle`${quad}`.toString({
    directives: false, // do not print @prefix
    graph: quad.graph as NamedNode,
  })
}

// consider replacing should with may
const messages = new TermMap<NamedNode, string>([
  [xsd.boolean, 'Boolean values should be formatted as "true" and "false" (or "0" and "1"). See also https://www.w3.org/TR/xmlschema-2/#boolean.'],
  [xsd.date, 'Dates should be formatted as YYYY-MM-DD as specified by ISO 8601. See also https://www.w3.org/TR/xmlschema-2/#date.'],
  [xsd.dateTime, 'Values should be formatted as YYYY-MM-DDThh:mm:ss. See also https://www.w3.org/TR/xmlschema-2/#dateTime.'],
  [xsd.gDay, 'Days should be formatted as DD. See also https://www.w3.org/TR/xmlschema-2/#gDay.'],
  [xsd.decimal, 'Decimals should be formatted as digits, possibly with a period to separate the fractional part. An optional leading sign is allowed. See also https://www.w3.org/TR/xmlschema-2/#decimal.'],
  [xsd.integer, 'Integers should be formatted as digits, with an optional leading sign. See also https://www.w3.org/TR/xmlschema-2/#integer.'],
  [xsd.gMonth, 'Months should be formatted as MM. See also https://www.w3.org/TR/xmlschema-2/#gMonth.'],
  [xsd.string, 'See also https://www.w3.org/TR/xmlschema-2/#string.'],
  [xsd.time, 'Values should be formatted as hh:mm:ss. See also https://www.w3.org/TR/xmlschema-2/#time.'],
  [xsd.gYear, 'Years should be formatted as YYYY. See also https://www.w3.org/TR/xmlschema-2/#gYear.'],
  [xsd.gYearMonth, 'Values should be formatted as YYYY-MM. See also https://www.w3.org/TR/xmlschema-2/#gYearMonth.'],
])

const typeName = new TermMap<NamedNode, string>([
  [xsd.boolean, 'boolean'],
  [xsd.date, 'date'],
  [xsd.dateTime, 'dateTime'],
  [xsd.gDay, 'day'],
  [xsd.decimal, 'decimal'],
  [xsd.integer, 'integer'],
  [xsd.gMonth, 'month'],
  [xsd.string, 'string'],
  [xsd.time, 'time'],
  [xsd.gYear, 'year'],
  [xsd.gYearMonth, 'year+month'],
])

function errorMessage(quad: Quad): string {
  const literal = quad.object as Literal
  if (!literal.datatype) {
    return `Invalid datatype for non-literal ${literal.value}`
  }
  const message = messages.get(literal.datatype)
  if (message) {
    return `the value "${literal.value}" in your CSV file does not conform to the selected datatype "${typeName.get(literal.datatype)}".\n${message}`
  }

  return `literal "${literal.value}" is not a valid value for datatype <${literal.datatype.value}>.`
}
