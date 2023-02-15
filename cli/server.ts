/* eslint-disable import/no-extraneous-dependencies */
import * as http from 'http'
import * as path from 'path'
import express from 'express'
import asyncMiddleware from 'middleware-async'
import debug from 'debug'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import * as command from './lib/commands'
import { opentelemetry } from './lib/otel/index'

dotenv.config({
  path: path.resolve(__dirname, '.env'),
})
dotenv.config({
  path: path.resolve(__dirname, '.test.env'),
})

let shutdownOtel: () => Promise<void> | undefined

async function main() {
  shutdownOtel = await opentelemetry()

  const log = debug('cube-creator')

  const app = express()

  app.enable('trust proxy')

  app.use(cors())

  app.use(bodyParser.urlencoded())

  app.get('/', (req, res) => res.status(204).end())

  app.post('/', asyncMiddleware(async (req, res) => {
    const transformJob = req.body.TRANSFORM_JOB_URI
    const publishJob = req.body.PUBLISH_JOB_URI
    const unlistJob = req.body.UNLIST_JOB_URI
    const importJob = req.body.IMPORT_JOB_URI
    if (!transformJob && !publishJob && !unlistJob && !importJob) {
      res.status(400)
      return res.send('No job defined')
    }

    if (transformJob) {
      command.transform({ to: 'graph-store', job: transformJob, debug: true }).catch((e) => log(e))
    }

    if (importJob) {
      command.importCube({ job: importJob, debug: true }).catch((e) => log(e))
    }

    if (publishJob) {
      command.publish({ to: 'graph-store', job: publishJob, debug: true }).catch((e) => log(e))
    }

    if (unlistJob) {
      command.unlist({ job: unlistJob, debug: true }).catch((e) => log(e))
    }

    return res.status(202).end()
  }))

  http.createServer(app).listen(80, () => log('Api ready'))
}

main().finally(() => {
  shutdownOtel()
})
