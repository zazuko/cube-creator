import express from 'express'
import debug from 'debug'
import cors from 'cors'
import bodyParser from 'body-parser'
import namespace from '@rdfjs/namespace'
import * as transform from './lib/commands/transform'

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

  app.post('/', async (req, res) => {
    const job = await req.body.JOB_URI
    if (!job) {
      res.status(400)
      return res.send('No job definded')
    }
    try {
      await tranform({ to: 'graph-store', job, debug: true })
    } catch (error) {
      res.status(500)
      return res.send(error.message)
    }

    res.status(201)
    return res.send()
  })

  app.listen(45680, () => log('Api ready'))
}

main()
