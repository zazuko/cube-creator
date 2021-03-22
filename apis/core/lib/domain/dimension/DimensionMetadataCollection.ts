import { GraphPointer } from 'clownface'
import { Constructor } from '@tpluscode/rdfine'
import type { Organization } from '@rdfine/schema'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, DimensionMetadataCollection } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import $rdf from 'rdf-ext'
import { shrink } from '@zazuko/rdf-vocabularies'
import { ResourceStore } from '../../ResourceStore'
import { BlankNode, DatasetCore, NamedNode, Term } from 'rdf-js'
import TermSet from '@rdfjs/term-set'

interface CreateColumnMetadata {
  store: ResourceStore
  cubeIdentifier: string
  organization: Organization
  columnMapping: ColumnMapping
}

interface FindDimensionMetadata {
  cubeIdentifier: string
  organization: Organization
  targetProperty: Term
}

interface ApiDimensionMetadataCollection {
  updateDimension(dimension: GraphPointer): DimensionMetadata.DimensionMetadata
  deleteDimension(dimension: DimensionMetadata.DimensionMetadata): void
  addDimensionMetadata(params: CreateColumnMetadata): DimensionMetadata.DimensionMetadata
  find(params: FindDimensionMetadata | Term): DimensionMetadata.DimensionMetadata | undefined
  renameDimensions(oldCube: NamedNode, newCube: NamedNode): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DimensionMetadataCollection extends ApiDimensionMetadataCollection {
  }
}

function copyMetadata(pointer: GraphPointer, metadata: DatasetCore, visited = new TermSet<BlankNode>()) {
  if (pointer.term.termType === 'BlankNode') {
    if (visited.has(pointer.term)) {
      return
    }

    visited.add(pointer.term)
  }

  for (const quad of metadata.match(pointer.term)) {
    pointer.addOut(quad.predicate, quad.object)

    if (quad.object.termType === 'BlankNode') {
      copyMetadata(pointer.node(quad.object), metadata, visited)
    }
  }
}

export default function Mixin<Base extends Constructor<Omit<DimensionMetadataCollection, keyof ApiDimensionMetadataCollection>>>(Resource: Base) {
  return class extends Resource implements ApiDimensionMetadataCollection {
    updateDimension(dimension: GraphPointer): DimensionMetadata.DimensionMetadata {
      let found: DimensionMetadata.DimensionMetadata | undefined
      const about = dimension.out(schema.about).term
      if (about) {
        found = this.find(about)
      }
      if (!found) {
        throw new Error('Dimension not found')
      }

      const dimensionMappings = found.mappings

      found.pointer.out().deleteOut()
      found.pointer.deleteOut()
      copyMetadata(found.pointer, dimension.dataset)

      found.mappings = dimensionMappings
      return found
    }

    deleteDimension(dimension: DimensionMetadata.DimensionMetadata): void {
      dimension.pointer.deleteOut()

      this.hasPart = this.hasPart.filter(part => !dimension.id.equals(part.id))
    }

    addDimensionMetadata({ cubeIdentifier, ...params }: CreateColumnMetadata): DimensionMetadata.DimensionMetadata {
      const identifier = params.organization.createIdentifier({
        cubeIdentifier,
        termName: params.columnMapping.targetProperty,
      })

      const existingDim = this.hasPart.find(dimMeta => dimMeta.about.equals(identifier))

      if (existingDim) {
        return existingDim
      }

      const dimensionMetadata = DimensionMetadata.create(this.pointer.node(this.getId(params.columnMapping)), {
        about: identifier,
      })

      this.pointer.addOut(schema.hasPart, dimensionMetadata.id)

      return dimensionMetadata
    }

    find(params: FindDimensionMetadata | Term): DimensionMetadata.DimensionMetadata | undefined {
      const identifier = 'termType' in params
        ? params
        : params.organization.createIdentifier({
          cubeIdentifier: params.cubeIdentifier,
          termName: params.targetProperty,
        })
      return this.hasPart.find(part => identifier.equals(part.about))
    }

    renameDimensions(oldCube: NamedNode, newCube: NamedNode | undefined) {
      if (!newCube) {
        return
      }

      const pattern = new RegExp(`^${oldCube.value}`)
      for (const dimension of this.hasPart) {
        dimension.about = $rdf.namedNode(dimension.about.value.replace(pattern, newCube.value))
      }
    }

    private getId(mapping: ColumnMapping) {
      const property = (mapping.targetProperty.termType === 'Literal')
        ? mapping.targetProperty.value
        : shrink(mapping.targetProperty.value) || encodeURI(mapping.targetProperty.value)

      return $rdf.namedNode(`${this.id.value}/${property}`)
    }
  }
}

Mixin.appliesTo = cc.DimensionMetadataCollection
