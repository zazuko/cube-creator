import { NamedNode, Term } from 'rdf-js'
import { SELECT } from '@tpluscode/sparql-builder'
import { CsvMapping, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { parsingClient } from '../../query-client'

export async function * getTablesForMapping(csvMapping: NamedNode, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?table`
    .WHERE`
      GRAPH ?table
      {
        ?table a ${cc.Table} ;
             ${cc.csvMapping} ${csvMapping} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const table = result.table
    if (table.termType === 'NamedNode') {
      yield table
    }
  }
}

export async function * getLinkedTablesForSource(csvSource: ResourceIdentifier, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?table`
    .WHERE`
      GRAPH ?table
      {
        ?table a ${cc.Table} ;
             ${cc.csvSource} ${csvSource} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const table = result.table
    if (table.termType === 'NamedNode') {
      yield table
    }
  }
}

/**
 * Returns column mappings which reference the given table
 */
export async function * getTableReferences(referencedTable: Table, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?columnMapping`
    .WHERE`
      GRAPH ?columnMapping
      {
        ?columnMapping a ${cc.ReferenceColumnMapping} ;
             ${cc.referencedTable} ${referencedTable.id} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const { columnMapping } = result
    if (columnMapping.termType === 'NamedNode') {
      yield columnMapping
    }
  }
}

export async function getTableForColumnMapping(columnMapping: NamedNode, client = parsingClient): Promise<Term> {
  const results = await SELECT
    .DISTINCT`?table`
    .WHERE`
    GRAPH ?table
    {
      ?table a ${cc.Table} ;
           ${cc.columnMapping} ${columnMapping} .
    }
    `
    .execute(client.query)

  if (results.length < 1) {
    throw new Error(`No table for column mapping ${columnMapping.value} found`)
  }
  if (results.length > 1) {
    throw new Error(`More than one table for column mapping ${columnMapping.value} found`)
  }
  return results[0].table
}

export async function getCubeTable(csvMapping: CsvMapping): Promise<Term | undefined> {
  const bindings = await SELECT`?table`
    .WHERE`
      GRAPH ?table {
        ?table a ${cc.ObservationTable} .
        ?table ${cc.csvMapping} ${csvMapping.id} .
      }
    `
    .execute(parsingClient.query)

  return bindings.shift()?.table
}
