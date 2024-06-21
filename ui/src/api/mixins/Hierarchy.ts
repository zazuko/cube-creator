import { Constructor, property } from '@tpluscode/rdfine'
import { md, meta } from '@cube-creator/core/namespace'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import type { NamedNode } from '@rdfjs/types'
import { Hierarchy, NextInHierarchy, Path } from '@/store/types'

function pathMixin<Base extends Constructor> (base: Base) {
  class Impl extends base implements Path {
    @property({ path: sh.inversePath })
    inversePath: NamedNode | undefined
  }

  return Impl
}

function nextInHierarchyMixin<Base extends Constructor> (base: Base) {
  class Impl extends base implements NextInHierarchy {
    @property.literal({ path: schema.name })
    name!: string

    @property.resource({ path: meta.nextInHierarchy, as: [nextInHierarchyMixin] })
    nextInHierarchy: NextInHierarchy | undefined

    @property.resource({ path: sh.path, as: [pathMixin] })
    property!: Path

    @property({ path: sh.targetClass, values: 'array' })
    targetType!: NamedNode[]
  }

  return Impl
}

function hierarchyLevelMixin<Base extends Constructor> (base: Base) {
  class Impl extends base {
    @property.literal({ path: schema.name })
    name!: string

    @property.resource({ path: meta.nextInHierarchy, as: [nextInHierarchyMixin] })
    nextInHierarchy: NextInHierarchy | undefined
  }

  return Impl
}

export default function mixin<Base extends Constructor> (base: Base) {
  class Impl extends hierarchyLevelMixin(base) implements Partial<Hierarchy> {
    @property({ path: md.sharedDimension })
    dimension!: NamedNode

    @property({ path: meta.hierarchyRoot, values: 'array' })
    hierarchyRoot!: NamedNode[]
  }

  return Impl
}

mixin.appliesTo = meta.Hierarchy
