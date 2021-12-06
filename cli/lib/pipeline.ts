import type * as Pipeline from 'barnard59-core/lib/Pipeline'

export const asStep = (pipeline: Pipeline.default) => pipeline

export function selectTransformation(this: Pipeline.Context, arg: {observationTable: Pipeline.default; otherTable: Pipeline.default}) {
  if (this.variables.get('transformed').isObservationTable === true) {
    this.logger.info('Input is cube table')
    return arg.observationTable
  }

  this.logger.info('Input is ordinary table')
  return arg.otherTable
}
