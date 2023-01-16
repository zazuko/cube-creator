import { createReadStream } from 'fs'
import path from 'path'
import { NamedNode, Quad } from 'rdf-js'
import httpError, { BadRequest } from 'http-errors'
import { Files } from '@cube-creator/express/multipart'
import $rdf from 'rdf-ext'
import SHACLValidator from 'rdf-validate-shacl'
import ValidationReport from 'rdf-validate-shacl/src/validation-report'
import { parsers } from '@rdfjs/formats-common'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { INSERT } from '@tpluscode/sparql-builder'
import { StreamClient } from 'sparql-http-client/StreamClient'
import through2 from 'through2'
import { md } from '@cube-creator/core/namespace'
import env from '../../env'
import { SharedDimensionsStore } from '../../store'
import { streamClient } from '../../sparql'

interface ImportedDimension {
  termSet: GraphPointer
}

interface ImportDimension {
  resource: GraphPointer
  files: Files
  store: SharedDimensionsStore
  client?: StreamClient
}

function isNamedNode(pointer: AnyPointer): pointer is GraphPointer<NamedNode> {
  return pointer.term?.termType === 'NamedNode'
}

const shapesPath = path.join(__dirname, 'importShapes.ttl')
export async function validateTermSet(termSet: GraphPointer): Promise<ValidationReport> {
  const shapes = await $rdf.dataset().import(parsers.import('text/turtle', createReadStream(shapesPath), {
    baseIRI: termSet.value,
  })!)
  const validator = new SHACLValidator(shapes)

  return validator.validate(termSet.dataset)
}

export async function importDimension({
  files,
  resource,
  store,
  client = streamClient,
}: ImportDimension): Promise<ImportedDimension | ValidationReport> {
  const importedDimension = resource.out(md.export).value
  if (!importedDimension) {
    throw new BadRequest('Import must contain exactly one Shared Dimension')
  }

  const exportedData = files[importedDimension]
  if (!exportedData) {
    throw new BadRequest(`Missing data for file ${importedDimension}`)
  }

  const graph = $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)
  const importStream = exportedData(env.MANAGED_DIMENSIONS_BASE)
    .pipe(through2.obj(function ({ subject, predicate, object }: Quad, _, next) {
      this.push($rdf.quad(subject, predicate, object, graph))
      next()
    }))
  const termSet = clownface({ dataset: await $rdf.dataset().import(importStream) })
    .has(rdf.type, md.SharedDimension)

  if (!termSet.term || !isNamedNode(termSet)) {
    throw new BadRequest('Import must contain exactly one Shared Dimension')
  }

  const report = await validateTermSet(termSet)
  if (!report.conforms) {
    return report
  }

  if (await store.exists(termSet.term, schema.DefinedTermSet)) {
    const identifier = termSet.out(schema.name, { language: '*' }).value
    throw new httpError.Conflict(`Shared Dimension '${identifier}' already exists`)
  }

  await INSERT.DATA`${termSet.dataset}`.execute(client.query)

  return {
    termSet: await store.load(termSet.term),
  }
}
