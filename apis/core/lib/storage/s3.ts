import { Readable } from 'stream'
import aws from 'aws-sdk'
import { PromiseResult } from 'aws-sdk/lib/request'
import type { MediaObject } from '@rdfine/schema'
import env from '@cube-creator/core/env'
import { log } from '../log.js'
import type { MediaStorage } from './types.js'

const logError = log.extend('s3').extend('error')
const logWarning = log.extend('s3').extend('warning')

const s3 = new aws.S3({
  endpoint: env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
})

const defaultS3Options = {
  Bucket: String(env.AWS_S3_BUCKET),
}

export async function saveFile(path: string, contents: Buffer | Readable | string): Promise<aws.S3.ManagedUpload.SendData> {
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

export function getDownloadLink(path: string): string {
  return s3.getSignedUrl('getObject', {
    ...defaultS3Options,
    Key: path,
  })
}

export function loadFile(path: string): Readable {
  return s3.getObject({
    ...defaultS3Options,
    Key: path,
  }).createReadStream()
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

export const mediaStorage: MediaStorage = {
  async getStream(media: MediaObject) {
    return loadFile(getKey(media))
  },

  async delete(media: MediaObject) {
    return deleteFile(getKey(media))
  },

  getDownloadLink(media: MediaObject) {
    return getDownloadLink(getKey(media))
  },
}

function getKey(media: MediaObject): string {
  const key = media.identifierLiteral

  if (!key) throw new Error('Missing media identifier')

  return key
}

export async function setup(): Promise<any> {
  const params = {
    ...defaultS3Options,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: [env.UI_BASE],
          AllowedMethods: ['GET', 'PUT', 'POST'],
          MaxAgeSeconds: 3000,
          ExposeHeaders: ['ETag'],
          AllowedHeaders: ['Authorization', 'x-amz-date', 'x-amz-content-sha256', 'content-type'],
        },
        {
          AllowedOrigins: ['*'],
          AllowedMethods: ['GET'],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  }

  return s3.putBucketCors(params).promise()
    .catch(error => { logWarning('Could not apply S3 CORS:', error) })
}
