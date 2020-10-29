import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { Collection } from '@rdfine/hydra'
import { cc } from '@cube-creator/core/namespace'
import { Table } from './Table'
import { Link } from './lib/Link'
import { NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'

export interface Job extends RdfResourceCore {
  tableCollection: Link<Collection<Table>>
  cubeGraph?: NamedNode
  label: string
}

export function JobMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements Job {
    @property.resource({ path: cc.tables })
    tableCollection!: Link<Collection<Table>>

    @property({ path: cc.cubeGraph })
    cubeGraph?: NamedNode

    @property.literal({ path: schema.label })
    label!: string
  }

  return Impl
}

JobMixin.appliesTo = cc.Job
