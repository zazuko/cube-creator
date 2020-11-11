import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { Collection } from '@rdfine/hydra'
import * as Rdfs from '@rdfine/rdfs'
import { Action, ActionMixin } from '@rdfine/schema'
import { cc } from '@cube-creator/core/namespace'
import { Table } from './Table'
import { Link } from './lib/Link'
import { NamedNode } from 'rdf-js'
import { schema, dcterms } from '@tpluscode/rdf-ns-builders'
import { initializer } from './lib/initializer'

export interface Job extends Action, Rdfs.Resource, RdfResource {
  tableCollection: Link<Collection<Table>>
  cubeGraph: NamedNode
  label: string
  created: Date
}

export function JobMixin<Base extends Constructor<RdfResource>>(base: Base) {
  class Impl extends Rdfs.ResourceMixin(ActionMixin(base)) implements Job {
    @property.resource({ path: cc.tables })
    tableCollection!: Link<Collection<Table>>

    @property({ path: cc.cubeGraph })
    cubeGraph!: NamedNode

    @property.literal({ path: schema.name })
    label!: string

    @property.literal({ path: dcterms.created, type: Date, initial: () => new Date() })
    created!: Date
  }

  return Impl
}

JobMixin.appliesTo = cc.Job

type RequiredProperties = 'label' | 'cubeGraph' | 'tableCollection'

export const create = initializer<Job, RequiredProperties>(JobMixin, {
  types: [cc.Job],
  actionStatus: schema.PotentialActionStatus,
})
