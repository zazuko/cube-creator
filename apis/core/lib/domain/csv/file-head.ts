import { Readable } from 'stream'

export function loadFileHeadString(
  stream: Readable,
  uniqueLines = 20,
): Promise<string> {
  const lines: string[] = []
  let partialLine = ''
  stream.on('readable', () => {
    let chunk
    while ((chunk = stream.read()) !== null) {
      let string = chunk.toString()
      if (!string.includes('\n')) {
        // continue reading until we reach the first \n
        partialLine += string
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
      newLines.forEach((line: string) => {
        if (!lines.includes(line)) {
          lines.push(line)
        }
      })

      // got all we need (header + nb uniqueLines)
      if (lines.length >= uniqueLines + 1) {
        lines.splice(uniqueLines + 1)
        stream.destroy()
      }
    }
  })

  return new Promise<string>(function(resolve, reject) {
    stream.on('close', () => resolve(lines.join('\n')))
    stream.on('error', reject)
  })
}
