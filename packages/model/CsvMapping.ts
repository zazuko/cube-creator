import { CsvSource } from './CsvSource'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

export interface CsvMapping extends RdfResourceCore {
  sources: CsvSource[]
}
