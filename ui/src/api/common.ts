import { RdfResource, RuntimeOperation } from 'alcaeus'
import { NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Actions } from '@/api/mixins/ApiResource'

export function findOperation (resource: RdfResource, idOrType: NamedNode): RuntimeOperation | null {
  const matches = resource.findOperations({
    bySupportedOperation: idOrType,
  })

  if (matches.length > 1) {
    console.error(`More than one match for operation ${idOrType} on ${resource.id}`)
  }

  return matches[0] || null
}

export function getOperation (resource: RdfResource, idOrType: NamedNode): RuntimeOperation {
  const operation = findOperation(resource, idOrType)

  if (!operation) {
    throw new Error(`Operation ${idOrType} not found on ${resource.id}`)
  }

  return operation
}

export const commonActions = (resource: RdfResource, additionalActions: Record<string, NamedNode> = {}): Actions => ({
  create: findOperation(resource, schema.CreateAction),
  edit: findOperation(resource, schema.UpdateAction),
  delete: findOperation(resource, schema.DeleteAction),
  ...Object.entries(additionalActions).reduce((actions, [key, term]) => {
    return {
      ...actions,
      [key]: findOperation(resource, term),
    }
  }, {} as Record<string, RuntimeOperation | null>)
})
