import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { _void, dcat, schema } from '@tpluscode/rdf-ns-builders'
import { cube } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import { Cube } from './Cube'

export interface Dataset extends RdfResource {
  hasPart: Cube[]
}

export function DatasetMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<Dataset> {
    @property.resource({ path: schema.hasPart, values: 'array', implicitTypes: [cube.Cube] })
    hasPart!: Cube[]
  }

  return Impl
}

DatasetMixin.appliesTo = _void.Dataset

export const create = initializer<Dataset>(DatasetMixin, {
  types: [_void.Dataset, schema.Dataset, dcat.Dataset],
})
