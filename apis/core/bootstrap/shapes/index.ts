import { CubeProjectShape } from './cube-project'
import { TableShape } from './table'
import { DatasetShape } from './dataset'
import { CSVSourceCreateShape, CSVSourceUpdateShape } from './csv-source'
import { JobUpdateShape, JobTriggerShape } from './jobs'
import { ColumnMappingShape } from './column-mapping'
import { DimensionMetadataShape, SharedDimensionMappingShape } from './dimension'

export default [
  CubeProjectShape,
  TableShape,
  DatasetShape,
  ColumnMappingShape,
  CSVSourceCreateShape,
  CSVSourceUpdateShape,
  JobUpdateShape,
  JobTriggerShape,
  DimensionMetadataShape,
  SharedDimensionMappingShape,
]
