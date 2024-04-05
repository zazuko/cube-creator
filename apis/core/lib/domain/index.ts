import $rdf from '@cube-creator/env'
import { ThingMixin } from '@rdfine/schema'
import { DictionaryBundle } from '@rdfine/prov/bundles'
import * as CoreModel from '@cube-creator/model'
import CsvMapping from './csv-mapping/CsvMapping.js'
import CsvSource from './csv-source/CsvSource.js'
import ProjectMixins from './cube-projects/Project.js'
import Table from './table/Table.js'
import Dataset from './dataset/Dataset.js'
import Resource from './Resource.js'
import OrganizationMixin from './organization/Organization.js'
import DimensionMetadataCollection from './dimension/DimensionMetadataCollection.js'
import { ProvDictionaryMixinEx } from './dimension-mapping/DimensionMapping.js'
import * as ColumnMappings from './column-mapping/ColumnMapping.js'

$rdf.rdfine().factory.addMixin(...Object.values(CoreModel))
$rdf.rdfine().factory.addMixin(CsvMapping)
$rdf.rdfine().factory.addMixin(CsvSource)
$rdf.rdfine().factory.addMixin(...ProjectMixins)
$rdf.rdfine().factory.addMixin(Dataset)
$rdf.rdfine().factory.addMixin(Table)
$rdf.rdfine().factory.addMixin(Resource)
$rdf.rdfine().factory.addMixin(DimensionMetadataCollection)
$rdf.rdfine().factory.addMixin(OrganizationMixin)
$rdf.rdfine().factory.addMixin(ProvDictionaryMixinEx)
$rdf.rdfine().factory.addMixin(...Object.values(ColumnMappings))

$rdf.rdfine().factory.addMixin(ThingMixin)
$rdf.rdfine().factory.addMixin(...DictionaryBundle)
