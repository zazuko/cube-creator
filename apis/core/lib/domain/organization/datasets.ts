import { dcat, dcterms, rdf } from '@tpluscode/rdf-ns-builders'
import clownface, { GraphPointer, MultiPointer } from 'clownface'
import { BlankNode, Literal, NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { create as createXml } from 'xmlbuilder2'
import { fetchOrganizationDatasets } from './query'
import { shrink } from '@zazuko/rdf-vocabularies'
import TermSet from '@rdfjs/term-set'

export async function getOrganizationDatasets(organization: NamedNode): Promise<string> {
  const quads = await fetchOrganizationDatasets(organization)
  const pointer = clownface({ dataset: $rdf.dataset(quads) })

  const datasetsPointer = pointer.node(dcat.Dataset).in(rdf.type)

  const rdfns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
  const dcatns = 'http://www.w3.org/ns/dcat#'
  const dctermsns = 'http://purl.org/dc/terms/'

  const xml = createXml({
    version: '1.0',
    encoding: 'utf-8',
    namespaceAlias: {
      rdf: rdfns,
      dcat: dcatns,
      dcterms: dctermsns,
    },
  }, {
    'rdf:RDF': {
      '@': {
        'xmlns:rdf': rdfns,
        'xmlns:dcat': dcatns,
      },
      'dcat:Catalog': {
        'dcat:dataset': datasetsPointer.map((dataset) => ({
          'dcat:Dataset': {
            'dcterms:identifier': serializeTerm(dataset.out(dcterms.identifier)),
            'dcterms:title': serializeTerm(dataset.out(dcterms.title)),
            'dcterms:description': serializeTerm(dataset.out(dcterms.description)),
            'dcterms:license': serializeTerm(dataset.out(dcterms.license)),
            'dcterms:issued': serializeTerm(dataset.out(dcterms.issued)),
            'dcterms:modified': serializeTerm(dataset.out(dcterms.modified)),
            'dcterms:publisher': serializeTerm(dataset.out(dcterms.publisher)),
            'dcterms:creator': serializeTerm(dataset.out(dcterms.creator)),
            'dcat:contactPoint': serializeTerm(dataset.out(dcat.contactPoint)),
            'dcat:theme': serializeTerm(dataset.out(dcat.theme)),
            'dcterms:language': serializeTerm(dataset.out(dcterms.language)),
            'dcterms:relation': serializeTerm(dataset.out(dcterms.relation)),
            'dcat:keyword': serializeTerm(dataset.out(dcat.keyword)),
            'dcat:landingPage': serializeTerm(dataset.out(dcat.landingPage)),
            'dcterms:spacial': serializeTerm(dataset.out(dcterms.spacial)),
            'dcterms:coverage': serializeTerm(dataset.out(dcterms.coverage)),
            'dcterms:temporal': serializeTerm(dataset.out(dcterms.temporal)),
            'dcat:distribution': serializeTerm(dataset.out(dcterms.distribution)),
            'dcterms:accrualPeriodicity': serializeTerm(dataset.out(dcterms.accrualPeriodicity)),
          },
        })),
      },
    },
  }).doc()

  return xml.end({ prettyPrint: true })
}

function serializeTerm(pointer: MultiPointer): Record<string, any> {
  return pointer.map((value) => {
    if (isLiteral(value)) {
      return serializeLiteral(value)
    } else if (isNamedNode(value)) {
      return serializeNamedNode(value)
    } else if (isBlankNode(value)) {
      return serializeBlankNode(value)
    } else {
      return {}
    }
  })
}

function isLiteral(pointer: GraphPointer): pointer is GraphPointer<Literal> {
  return pointer.term.termType === 'Literal'
}

function isNamedNode(pointer: GraphPointer): pointer is GraphPointer<NamedNode> {
  return pointer.term.termType === 'NamedNode'
}

function isBlankNode(pointer: GraphPointer): pointer is GraphPointer<BlankNode> {
  return pointer.term.termType === 'BlankNode'
}

function serializeLiteral({ term }: GraphPointer<Literal>) {
  const attrs: Record<string, string> = {}

  if (term.language) {
    attrs['xml:lang'] = term.language
  }

  if (term.datatype) {
    attrs['xml:datatype'] = term.datatype.value
  }

  return {
    '@': attrs,
    '#': term.value,
  }
}

function serializeNamedNode({ value }: GraphPointer<NamedNode>) {
  return {
    '@': { 'rdf:resource': value },
  }
}

function serializeBlankNode(pointer: GraphPointer<BlankNode>) {
  const type = pointer.out(rdf.type).value

  if (!type) return {}

  const properties = new TermSet([...pointer.dataset.match(pointer.term)]
    .map(({ predicate }) => predicate)
    .filter((term) => !term.equals(rdf.type)))

  const resource = [...properties].reduce((acc, property) =>
    ({ ...acc, [shrink(property.value)]: serializeTerm(pointer.out(property)) }), {})

  return {
    [shrink(type)]: resource,
  }
}
