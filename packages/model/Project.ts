import * as Rdfs from '@rdfine/rdfs'
import { CsvMapping } from './CsvMapping'

export interface Project extends Rdfs.Resource {
  csvMapping?: CsvMapping
}
