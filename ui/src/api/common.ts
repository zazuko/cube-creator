import { Resource, RuntimeOperation } from 'alcaeus'
import { NamedNode } from 'rdf-js'

export function findOperation (resource: Resource, idOrType: NamedNode): RuntimeOperation | null {
  const matches = resource.findOperations({
    bySupportedOperation: idOrType,
  })

  if (matches.length > 1) {
    console.error(`More than one match for operation ${idOrType} on ${resource.id}`)
  }

  return matches[0] || null
}

export function getOperation (resource: Resource, idOrType: NamedNode): RuntimeOperation {
  const operation = findOperation(resource, idOrType)

  if (!operation) {
    throw new Error(`Operation ${idOrType} not found on ${resource.id}`)
  }

  return operation
}
