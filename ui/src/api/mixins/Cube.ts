import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { Cube } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements Cube {
    get actions () {
      return commonActions(this)
    }
  }
}

mixin.appliesTo = ns.cube.Cube
