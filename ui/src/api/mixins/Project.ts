import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { Project, CSVMapping } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements Project {
    get actions () {
      return commonActions(this)
    }

    get csvMapping (): CSVMapping | null {
      return this.get<CSVMapping>(ns.cc.csvMapping)
    }
  }
}

mixin.appliesTo = ns.cc.CubeProject
