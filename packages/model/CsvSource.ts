import type * as Schema from '@rdfine/schema'
import type * as Csvw from '@rdfine/csvw'
import RdfResourceImpl, { Initializer, RdfResource, RdfResourceCore, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { DialectMixin } from '@rdfine/csvw'
import { MediaObjectMixin as SchemaMediaObjectMixin } from '@rdfine/schema'
import { initializer } from './lib/initializer'
import { Link } from './lib/Link'
import { CsvMapping } from './CsvMapping'
import { CsvColumn, CsvColumnMixin } from './CsvColumn'
import type { Collection } from '@rdfine/hydra'
import { blankNode } from '@rdf-esm/data-model'
import type { DatasetCore, NamedNode } from 'rdf-js'
import type { GraphPointer } from 'clownface'

export interface MediaObjectEx {
  sourceKind: NamedNode
}

declare module '@rdfine/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MediaObject extends MediaObjectEx {}
}

export interface CsvSource extends RdfResource {
  associatedMedia: Schema.MediaObject
  name: string
  error?: string
  dialect: Csvw.Dialect
  csvMapping: Link<CsvMapping>
  columns: CsvColumn[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SourcesCollection extends Collection<CsvSource> {

}

export function MediaObjectMixin<Base extends Constructor<Omit<Schema.MediaObject, keyof MediaObjectEx>>>(Resource: Base): Constructor<RdfResourceCore & MediaObjectEx> & Base {
  class Impl extends Resource implements MediaObjectEx {
    @property({ path: cc.sourceKind })
    sourceKind!: NamedNode
  }

  return Impl
}

MediaObjectMixin.appliesTo = schema.MediaObject

export const mediaObjectFromPointer = <D extends DatasetCore>(pointer: GraphPointer<ResourceIdentifier, D>, initializer: Initializer<Schema.MediaObject<D>> = {}): Schema.MediaObject<D> => {
  return RdfResourceImpl.factory.createEntity(pointer, [MediaObjectMixin, SchemaMediaObjectMixin], {
    initializer: {
      ...initializer,
      types: [schema.MediaObject],
    },
  })
}

export function CsvSourceMixin<Base extends Constructor>(base: Base): Mixin {
  class Impl extends base implements Partial<CsvSource> {
    @property.resource({ path: schema.associatedMedia, as: [MediaObjectMixin, SchemaMediaObjectMixin] })
    associatedMedia!: Schema.MediaObject

    @property.literal({ path: schema.name })
    name!: string

    @property.literal({ path: schema.error })
    error?: string

    @property.resource({ path: csvw.dialect, as: [DialectMixin], initial: () => blankNode() })
    dialect!: Csvw.Dialect

    @property.resource({ path: cc.csvMapping })
    csvMapping!: Link<CsvMapping>

    @property.resource({ path: csvw.column, values: 'array', as: [CsvColumnMixin] })
    columns!: CsvColumn[]
  }

  return Impl
}

CsvSourceMixin.appliesTo = cc.CSVSource
CsvSourceMixin.Class = CsvSourceMixin(RdfResourceImpl)

type RequireProperties = 'name' | 'csvMapping'

export const create = initializer<CsvSource, RequireProperties>(CsvSourceMixin, {
  types: [cc.CSVSource],
})
