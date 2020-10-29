import * as CoreModel from '@cube-creator/model'
import RdfResourceImpl from '@tpluscode/rdfine'
import CsvMapping from './csv-mapping/CsvMapping'
import Project from './cube-projects/Project'

RdfResourceImpl.factory.addMixin(...Object.values(CoreModel))
RdfResourceImpl.factory.addMixin(CsvMapping)
RdfResourceImpl.factory.addMixin(Project)
