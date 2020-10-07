import aws from 'aws-sdk'
import { Readable } from 'stream'
import { PromiseResult } from 'aws-sdk/lib/request'
import env from '../env'
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
  return s3.deleteObject({
    ...defaultS3Options,
    Key: path,
  }).promise()
}

export async function loadFileString(path: string): Promise<string | null> {
  const file = await s3.getObject({
    ...defaultS3Options,
    Key: path,
  }).promise()

  if (file.Body) {
    return file.Body.toString()
  }
  logError('Could not read file "%s" from S3.', path)
  return null
}

export async function loadFileHeadString(path: string, uniqueLines = 20): Promise<string> {
  let nextByte = 0
  let bytesToRead = 1024
  const lines: string[] = []
  let partialLine = ''
  let file

  while (true) {
    if (file?.ContentLength) {
      // range shouldn't read beyond the end of file
      if (file.ContentLength > (nextByte + bytesToRead)) {
        bytesToRead = file.ContentLength - nextByte
      }
    }

    try {
      file = await s3.getObject({
        ...defaultS3Options,
        Key: path,
        Range: `bytes=${nextByte}-${nextByte + bytesToRead}`,
      }).promise()
    } catch (err) {
      if (err.code === 'InvalidRange') {
        // range is bigger than the whole file, so reduce the range
        if (nextByte === 0) {
          bytesToRead /= 2
          continue
        }
        if (file?.ContentLength && nextByte > file.ContentLength) {
          // we read the whole file
          break
        }
      } else {
        throw err
      }
    }
    if (!file || !file.Body) {
      // end of file
      break
    }

    let string = file.Body?.toString() || ''
    if (!string.includes('\n')) {
      // continue reading until we reach the first \n
      partialLine += string
      nextByte += bytesToRead
      continue
    }
    if (partialLine) {
      string = partialLine + string
      partialLine = ''
    }

    // carry the beginning of the last line over to next iteration
    if (!string.endsWith('\n')) {
      partialLine = string.substring(string.lastIndexOf('\n') + '\n'.length)
      string = string.substring(0, string.lastIndexOf('\n'))
    }

    const newLines = string.split('\n')
    // always keep the 1st line
    if (lines.length === 0) {
      lines.push(newLines.shift() as string)
    }

    // only keep unique lines otherwise
    newLines.forEach((line) => {
      if (!lines.includes(line)) {
        lines.push(line)
      }
    })

    // got all we need
    if (lines.length >= uniqueLines) {
      lines.splice(uniqueLines)
      break
    }

    nextByte += bytesToRead
  }

  return lines.join('\n')
}
