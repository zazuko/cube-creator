import * as CoreModel from '@cube-creator/model'
import RdfResourceImpl from '@tpluscode/rdfine'
import CsvMapping from './csv-mapping/CsvMapping'
import Project from './cube-projects/Project'
import Dataset from './dataset/Dataset'

RdfResourceImpl.factory.addMixin(...Object.values(CoreModel))
RdfResourceImpl.factory.addMixin(CsvMapping)
RdfResourceImpl.factory.addMixin(Project)
RdfResourceImpl.factory.addMixin(Dataset)
