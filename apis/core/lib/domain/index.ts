import * as CoreModel from '@cube-creator/model'
import RdfResourceImpl from '@tpluscode/rdfine'
import CsvMapping from './csv-mapping/CsvMapping'
import CsvSource from './csv-source/CsvSource'
import Project from './cube-projects/Project'
import Table from './table/Table'
import Dataset from './dataset/Dataset'

RdfResourceImpl.factory.addMixin(...Object.values(CoreModel))
RdfResourceImpl.factory.addMixin(CsvMapping)
RdfResourceImpl.factory.addMixin(CsvSource)
RdfResourceImpl.factory.addMixin(Project)
RdfResourceImpl.factory.addMixin(Dataset)
RdfResourceImpl.factory.addMixin(Table)
