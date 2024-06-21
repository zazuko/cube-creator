import { CubeProjectShape } from './cube-project.js'
import { TableShape } from './table.js'
import { DatasetShape } from './dataset.js'
import { CSVSourceCreateShape, CSVSourceUpdateShape } from './csv-source.js'
import { JobUpdateShape, JobTriggerShape } from './jobs.js'
import { ColumnMappingShape } from './column-mapping.js'
import { DimensionMetadataShape, SharedDimensionMappingShape, SharedDimensionMappingImportShape } from './dimension.js'

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
  SharedDimensionMappingImportShape,
]
