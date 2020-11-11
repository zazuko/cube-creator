/* eslint-disable import/no-extraneous-dependencies */
import express from 'express'
import * as http from 'http'
import asyncMiddleware from 'middleware-async'
import debug from 'debug'
import cors from 'cors'
import bodyParser from 'body-parser'
import namespace from '@rdfjs/namespace'
import dotenv from 'dotenv'
import * as path from 'path'
import * as transform from './lib/commands/transform'

dotenv.config({
  path: path.resolve(__dirname, '.env'),
})
dotenv.config({
  path: path.resolve(__dirname, '.test.env'),
})

const ns = {
  pipeline: namespace('urn:pipeline:cube-creator'),
}

const pipelines = {
  TransformFiles: ns.pipeline('#Main'),
}

async function main() {
  const log = debug('cube-creator')

  const app = express()

  app.enable('trust proxy')

  app.use(cors())

  app.use(bodyParser.urlencoded())

  app.get('/', (req, res) => res.status(204).end())

  const tranform = transform.default(pipelines.TransformFiles, log)

  app.post('/', asyncMiddleware(async (req, res) => {
    const job = req.body.JOB_URI
    if (!job) {
      res.status(400)
      return res.send('No job defined')
    }

    tranform({ to: 'graph-store', job, debug: true }).catch((e) => log(e))

    return res.status(202).end()
  }))

  http.createServer(app).listen(80, () => log('Api ready'))
}

main()
