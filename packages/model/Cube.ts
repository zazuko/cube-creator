import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { IriTemplate } from '@rdfine/hydra'
import { dcterms, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import { NamedNode } from 'rdf-js'

export interface Cube extends RdfResourceCore {
  dateCreated: Date
  creator: NamedNode
  observations: IriTemplate
}

export function CubeMixin<Base extends Constructor>(Resource: Base): Mixin {
  class Impl extends Resource implements Cube {
    @property.literal({
      path: schema.dateCreated,
      datatype: xsd.date,
      type: Date,
      initial: () => new Date(),
    })
    dateCreated!: Date

    @property({ path: dcterms.creator })
    creator!: NamedNode

    @property.resource({ path: cc.observations })
    readonly observations!: IriTemplate
  }

  return Impl
}

CubeMixin.appliesTo = cube.Cube

type RequiredProperties = 'creator'

export const create = initializer<Cube, RequiredProperties>(CubeMixin, {
  types: [cube.Cube],
})
