import { scale } from '@cube-creator/core/namespace'
import type{ DimensionMetadata } from '@cube-creator/model'

export function canBeMappedToManagedDimension(dimension: DimensionMetadata): boolean {
  const { scaleOfMeasure } = dimension

  return !!scaleOfMeasure && (scaleOfMeasure.equals(scale.Nominal) || scaleOfMeasure.equals(scale.Ordinal))
}
