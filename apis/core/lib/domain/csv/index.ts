import { parse as CSVparse, Options } from 'csv-parse'
import CSVSniffer from 'csv-sniffer'

const csvDelimiters = [',', ';', '\t']
const sniffer = new (CSVSniffer())(csvDelimiters)

interface Parsed {
  header: string[]
  rows: string[][]
  headerTrimmed: boolean

}

export function parse(csv: string, options: Options): Promise<Parsed> {
  return new Promise((resolve, reject) => CSVparse(csv, options, (err, records: string[][]) => {
    if (err) {
      reject(err)
      return
    }
    const [header, ...rows] = records

    let headerTrimmed = false

    resolve({
      header: header.map((name) => {
        const trimmed = name.trim()
        if (trimmed !== name) {
          headerTrimmed = true
        }
        return trimmed
      }),
      headerTrimmed,
      rows,
    })
  }))
}

export async function sniffParse(csv: string): Promise<Parsed & { dialect: {delimiter: string; quote: string} }> {
  const detectedCsvFormat = sniffer.sniff(csv)
  const csvDialect = {
    bom: true,
    delimiter: detectedCsvFormat.delimiter,
    quote: detectedCsvFormat.quoteChar || '',
  }
  const parserOptions = {
    to: 100,
    ...csvDialect,
  }

  const records = await parse(csv, parserOptions)

  return {
    dialect: csvDialect,
    ...records,
  }
}
