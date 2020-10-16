import aws from 'aws-sdk'
import { isReadable } from 'isstream'
import { Readable } from 'stream'
import { PromiseResult } from 'aws-sdk/lib/request'
import env from '@cube-creator/core/env'
import { log } from '../log'

const logError = log.extend('s3').extend('error')

const s3 = new aws.S3({
  endpoint: env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
})

const defaultS3Options = {
  Bucket: String(env.AWS_S3_BUCKET),
}

export async function saveFile(path: string, contents: Readable | string): Promise<aws.S3.ManagedUpload.SendData> {
  const upload = s3.upload({
    ...defaultS3Options,
    Body: contents,
    Key: path,
  })

  return upload.promise()
}

export async function deleteFile(path: string): Promise<PromiseResult<aws.S3.DeleteObjectOutput, aws.AWSError>> {
  return s3
    .deleteObject({
      ...defaultS3Options,
      Key: path,
    })
    .promise()
}

export async function loadFile(path: string): Promise<Readable | null> {
  const file = await s3.getObject({
    ...defaultS3Options,
    Key: path,
  }).promise()

  if (file.Body instanceof Buffer) {
    const readable = new Readable()
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    readable._read = () => { }
    readable.push(file.Body)
    readable.push(null)
    return readable
  }

  if (isReadable(file.Body)) {
    return file.Body as Readable
  }

  logError('Could not read file "%s" from S3. It was neither Buffer or Readable', path)
  return null
}

export async function loadFileString(path: string): Promise<string | null> {
  const file = await s3
    .getObject({
      ...defaultS3Options,
      Key: path,
    })
    .promise()

  if (file.Body) {
    return file.Body.toString()
  }
  logError('Could not read file "%s" from S3.', path)
  return null
}
