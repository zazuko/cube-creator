/* eslint-disable import/no-extraneous-dependencies */
import express from 'express'
import * as http from 'http'
import asyncMiddleware from 'middleware-async'
import debug from 'debug'
import cors from 'cors'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import * as path from 'path'
import * as command from './lib/commands'

dotenv.config({
  path: path.resolve(__dirname, '.env'),
})
dotenv.config({
  path: path.resolve(__dirname, '.test.env'),
})

async function main() {
  const log = debug('cube-creator')

  const app = express()

  app.enable('trust proxy')

  app.use(cors())

  app.use(bodyParser.urlencoded())

  app.get('/', (req, res) => res.status(204).end())

  app.post('/', asyncMiddleware(async (req, res) => {
    const transformJob = req.body.TRANSFORM_JOB_URI
    const publishJob = req.body.PUBLISH_JOB_URI
    const importJob = req.body.IMPORT_JOB_URI
    if (!transformJob && !publishJob && !importJob) {
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
      command.publish({ job: publishJob, debug: true }).catch((e) => log(e))
    }
    return res.status(202).end()
  }))

  http.createServer(app).listen(80, () => log('Api ready'))
}

main()
