import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { schema } from '@tpluscode/rdf-ns-builders'
import { CubeMetadata, Cube } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements CubeMetadata {
    get actions () {
      return commonActions(this)
    }

    get cube (): Cube {
      return this.get(schema.hasPart)
    }
  }
}

mixin.appliesTo = schema.Dataset
