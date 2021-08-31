import { ResourceMixin } from '@rdfine/rdfs'
import { CsvMapping, CsvMappingMixin } from './CsvMapping'
import { Constructor, namespace, property, RdfResource, ResourceIdentifier } from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import RdfResourceImpl, { Initializer, RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { cc } from '@cube-creator/core/namespace'
import { DatasetCore, NamedNode } from 'rdf-js'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import { Organization, Person, PersonMixin } from '@rdfine/schema'
import { initializer } from './lib/initializer'
import { childResource } from './lib/resourceIdentifiers'
import { Link } from './lib/Link'
import type { Collection } from '@rdfine/hydra'
import { JobCollection } from './Job'
import { Dataset } from './Dataset'

export interface Project extends RdfResource {
  csvMapping?: CsvMapping
  dataset: Link<Dataset>
  cubeGraph: NamedNode
  creator: Person
  label: string
  jobCollection: Link<JobCollection>
  maintainer: Link<Organization>
  publishedRevision: number
  sourceKind: NamedNode
  export: NamedNode
}

export interface CsvProject extends Project {
  cubeIdentifier: string
}

export interface ImportProject extends Project {
  sourceCube: NamedNode
  sourceGraph: NamedNode | undefined
  sourceEndpoint: NamedNode
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProjectsCollection extends Collection<CsvProject | ImportProject> {

}

export const isCsvProject = (project: CsvProject | ImportProject): project is CsvProject => {
  return !!project.pointer.out(cc.csvMapping).term
}

export function ProjectMixin<Base extends Constructor>(base: Base): Mixin {
  @namespace(cc)
  class Impl extends ResourceMixin(base) implements Partial<CsvProject>, Partial<ImportProject> {
    @property.resource({ as: [CsvMappingMixin] })
    csvMapping?: CsvMapping

    @property.resource({ initial: childResource('dataset') })
    dataset!: Link<Dataset>

    @property({ initial: childResource('cube-data') })
    cubeGraph!: NamedNode

    @property.literal({ path: dcterms.identifier })
    cubeIdentifier?: string

    @property.resource({ path: schema.maintainer })
    maintainer!: Link<Organization>

    @property.literal({ path: cc.latestPublishedRevision, type: Number })
    publishedRevision?: number

    @property.resource({ path: dcterms.creator, as: [PersonMixin] })
    creator!: Person

    @property.resource({ path: cc.jobCollection })
    jobCollection!: Link<JobCollection>

    @property({ path: cc.projectSourceKind })
    sourceKind!: NamedNode

    @property({ path: cc['CubeProject/sourceCube'] })
    sourceCube!: NamedNode

    @property({ path: cc['CubeProject/sourceGraph'] })
    sourceGraph?: NamedNode

    @property({ path: cc['CubeProject/sourceEndpoint'] })
    sourceEndpoint!: NamedNode

    @property({ path: cc.export, initial: childResource('export') })
    export!: NamedNode
  }

  return Impl
}

ProjectMixin.appliesTo = cc.CubeProject

type CsvProjectMandatoryFields = 'creator' | 'label' | 'maintainer' | 'cubeIdentifier' | 'sourceKind'
export const create = initializer<CsvProject, CsvProjectMandatoryFields>(ProjectMixin)

type ImportProjectMandatoryFields = 'creator' | 'label' | 'maintainer' | 'sourceCube' | 'sourceEndpoint' | 'sourceKind'
export const createImportProject = initializer<ImportProject, ImportProjectMandatoryFields>(ProjectMixin)

export const fromPointer = <D extends DatasetCore>(pointer: GraphPointer<ResourceIdentifier, D>, initializer: Initializer<Project> = {}): Project & RdfResourceCore<D> => {
  return RdfResourceImpl.factory.createEntity(pointer, [ProjectMixin], {
    initializer: {
      ...initializer,
      types: [cc.CubeProject],
    },
  })
}
