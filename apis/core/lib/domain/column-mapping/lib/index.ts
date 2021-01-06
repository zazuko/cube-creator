import { ColumnMapping, Project, Table } from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import { Term } from 'rdf-js'
import { ResourceStore } from '../../../ResourceStore'
import { findOrganization } from '../../organization/query'

export async function findMapping(table: Table, targetProperty: Term, store: ResourceStore): Promise<ColumnMapping | null> {
  const { organizationId, projectId } = await findOrganization({ table })
  const { cubeIdentifier } = await store.getResource<Project>(projectId)
  const organization = await store.getResource<Organization>(organizationId)

  for (const columnMappingLink of table.columnMappings) {
    const columnMapping = await store.getResource<ColumnMapping>(columnMappingLink.id, { allowMissing: true })
    if (!columnMapping) {
      continue
    }

    if (columnMapping.targetProperty.equals(targetProperty)) {
      return columnMapping
    }

    const effectiveProperty = organization.createIdentifier({
      cubeIdentifier,
      termName: targetProperty,
    })
    if (columnMapping.targetProperty.equals(effectiveProperty)) {
      return columnMapping
    }
  }

  return null
}
