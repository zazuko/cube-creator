import { qudt } from '@tpluscode/rdf-ns-builders'
import type{ DimensionMetadata } from '@cube-creator/model'

export function canBeMappedToSharedDimension(dimension: DimensionMetadata): boolean {
  const { scaleOfMeasure } = dimension

  return !!scaleOfMeasure && (scaleOfMeasure.equals(qudt.NominalScale) || scaleOfMeasure.equals(qudt.OrdinalScale))
}
