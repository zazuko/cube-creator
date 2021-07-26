import express from 'express'
import os from 'os'
import companion from '@uppy/companion'
import env from '@cube-creator/core/env'
import bodyParser from 'body-parser'
import { nanoid } from 'nanoid'
import $rdf from 'rdf-ext'

const apiURL = new URL(env.API_CORE_BASE)

const app = express.Router()

app.use(bodyParser.json())

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
      getKey: (req: express.Request, filename: string, metadata: any) => {
        // TODO: Check if file exists. Issue, `getKey` cannot return a promise.
        const csvMapping = $rdf.namedNode(metadata.csvMapping)
        return `${csvMapping.value.replace(env.API_CORE_BASE, '')}/${filename}`
      },
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

export default app
