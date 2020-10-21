import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { findOperation } from '../common'
import { TableCollection } from '@/types'

export default function Mixin<Base extends Constructor<Collection>> (base: Base) {
  return class extends base implements TableCollection {
    get actions () {
      return {
        create: findOperation(this, schema.CreateAction),
      }
    }
  }
}

Mixin.appliesTo = ns.cc.TableCollection
