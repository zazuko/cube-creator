import { CubeProjectShape } from './cube-project'
import { TableShape } from './table'
import { DatasetShape } from './dataset'
import { CSVSourceShape } from './csv-source'
import { JobUpdateShape, JobTriggerShape } from './jobs'
import { ColumnMappingShape } from './column-mapping'
import { DimensionMetadataShape, SharedDimensionMappingShape } from './dimension'

export default [
  CubeProjectShape,
  TableShape,
  DatasetShape,
  ColumnMappingShape,
  CSVSourceShape,
  JobUpdateShape,
  JobTriggerShape,
  DimensionMetadataShape,
  SharedDimensionMappingShape,
]
