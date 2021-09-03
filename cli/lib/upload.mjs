import nodeFetch from 'node-fetch'
import {PassThrough} from 'readable-stream'
import duplexify from 'duplexify'

export async function plainFetch() {
    const inputStream = new PassThrough()
    const outputStream = new PassThrough()

    try {
        const response = await nodeFetch('http://localhost:3030/test/data', {
            method: 'POST',
            body: inputStream,
            headers: {
                'content-type': 'application/n-triples'
            }
        })

        response.body.pipe(outputStream)
    } catch (err) {
        outputStream.emit('error', err)
    }

    return duplexify(inputStream, outputStream)
}
