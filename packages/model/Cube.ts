import type { NamedNode } from '@rdfjs/types'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { IriTemplate } from '@rdfine/hydra'
import { dcterms, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { namedNode } from '@rdf-esm/data-model'
import { initializer } from './lib/initializer'

export const Draft = namedNode('https://ld.admin.ch/vocabulary/CreativeWorkStatus/Draft')
export const Published = namedNode('https://ld.admin.ch/vocabulary/CreativeWorkStatus/Published')

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
