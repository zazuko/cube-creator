import type Pipeline from 'barnard59-core/lib/Pipeline'

export const asStep = (pipeline: Pipeline) => pipeline

export function selectTransformation(this: Pipeline.Context, arg: {observationTable: Pipeline; otherTable: Pipeline}) {
  if (this.variables.get('transformed').isObservationTable === true) {
    this.logger.info('Input is observation table')
    return arg.observationTable
  }

  this.logger.info('Input is ordinary table')
  return arg.otherTable
}
