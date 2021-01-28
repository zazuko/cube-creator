import { ThingMixin } from '@rdfine/schema'
import { DictionaryBundle } from '@rdfine/prov/bundles'
import * as CoreModel from '@cube-creator/model'
import RdfResourceImpl from '@tpluscode/rdfine'
import CsvMapping from './csv-mapping/CsvMapping'
import CsvSource from './csv-source/CsvSource'
import Project from './cube-projects/Project'
import Table from './table/Table'
import Dataset from './dataset/Dataset'
import Resource from './Resource'
import OrganizationMixin from './organization/Organization'
import DimensionMetadataCollection from './dimension/DimensionMetadataCollection'
import { ProvDictionaryMixinEx } from './dimension-mapping/DimensionMapping'

RdfResourceImpl.factory.addMixin(...Object.values(CoreModel))
RdfResourceImpl.factory.addMixin(CsvMapping)
RdfResourceImpl.factory.addMixin(CsvSource)
RdfResourceImpl.factory.addMixin(Project)
RdfResourceImpl.factory.addMixin(Dataset)
RdfResourceImpl.factory.addMixin(Table)
RdfResourceImpl.factory.addMixin(Resource)
RdfResourceImpl.factory.addMixin(DimensionMetadataCollection)
RdfResourceImpl.factory.addMixin(OrganizationMixin)
RdfResourceImpl.factory.addMixin(ProvDictionaryMixinEx)

RdfResourceImpl.factory.addMixin(ThingMixin)
RdfResourceImpl.factory.addMixin(...DictionaryBundle)
