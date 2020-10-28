import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { commonActions } from '../common'
import { TableCollection, Table } from '@/types'

export default function mixin<Base extends Constructor<Collection<Table>>> (base: Base): Mixin {
  return class extends base implements TableCollection {
    get actions () {
      return commonActions(this)
    }
  }
}

mixin.appliesTo = ns.cc.TableCollection
