import winston from 'winston'
import { OnViolation } from 'barnard59-shacl/validate.js'

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
})

export const prettyPrintReport: OnViolation = function ({ context, report }) {
  const jsonld = context.env.rdfine.sh.ValidationReport(report.pointer).toJSON()
  context.logger.error(JSON.stringify(jsonld, null, 2))

  return false
}
