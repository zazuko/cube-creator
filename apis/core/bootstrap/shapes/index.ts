import { CubeProjectShape } from './cube-project'
import { TableShape } from './table'
import { CSVSourceShape } from './csv-source'
import { JobUpdateShape, JobTriggerShape } from './jobs'
import { ColumnMappingShape } from './column-mapping'

export default [
  CubeProjectShape,
  TableShape,
  ColumnMappingShape,
  CSVSourceShape,
  JobUpdateShape,
  JobTriggerShape,
]
