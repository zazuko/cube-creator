import express from 'express'
import os from 'os'
import companion from '@uppy/companion'
import env from '@cube-creator/core/env'
import bodyParser from 'body-parser'
import { nanoid } from 'nanoid'
import $rdf from 'rdf-ext'

import { sourceWithFilenameExists } from './domain/queries/csv-source'

const apiURL = new URL(env.API_CORE_BASE)

const app = express.Router()

app.use(bodyParser.json())

// Check if file already exists before companion handler
app.post('/s3/multipart', async (req, res, next) => {
  const filename = req.body.filename
  const metadata = req.body.metadata || {}
  const csvMapping = $rdf.namedNode(metadata.csvMapping)
  const isReplace = !!metadata.replace

  if (!metadata.csvMapping) {
    res.status(400).send({ message: 'Missing csvMapping metadata' })
  } else if (!isReplace && await sourceWithFilenameExists(csvMapping, filename)) {
    res.status(409).send({ message: `A file named ${filename} has already been added to the project` })
  } else {
    next()
  }
})

app.use(companion.app({
  providerOptions: {
    s3: {
      awsClientOptions: {
        endpoint: env.AWS_S3_ENDPOINT,
        s3ForcePathStyle: true,
      },
      key: env.AWS_ACCESS_KEY_ID,
      secret: env.AWS_SECRET_ACCESS_KEY,
      bucket: env.AWS_S3_BUCKET,
      acl: 'private',
      getKey: (req: express.Request, filename: string, metadata: Record<string, string>) => buildKey(filename, metadata),
    },
  },
  server: {
    host: apiURL.host,
    protocol: apiURL.protocol,
    // This MUST match the path you specify in `app.use()`
    path: '/upload',
  },
  filePath: os.tmpdir(),
  secret: nanoid(30),
}))

function buildKey(filename: string, metadata: Record<string, string>) {
  const isReplace = !!metadata.replace
  const csvMappingURI = metadata.csvMapping

  // When replacing a source file, we use a temporary file key to avoid
  // overriding the file before it gets validated. The temporary files
  // will then get deleted.
  const fileKey = isReplace ? nanoid() : filename

  return `${csvMappingURI.replace(env.API_CORE_BASE, '')}/${fileKey}`
}

export default app
