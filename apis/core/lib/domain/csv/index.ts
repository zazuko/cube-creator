import CSVparse from 'csv-parse'
import CSVSniffer from 'csv-sniffer'

const csvDelimiters = [',', ';', '\t']
const sniffer = new (CSVSniffer())(csvDelimiters)

function parse(csv: string, options: CSVparse.Options): Promise<Array<Array<any>>> {
  return new Promise((resolve, reject) => CSVparse(csv, options, (err, records) => {
    if (err) {
      reject(err)
      return
    }
    resolve(records)
  }))
}

export async function sniffParse(csv: string): Promise<{ header: any[]; rows: any[] }> {
  const detectedCsvFormat = sniffer.sniff(csv)
  const csvDialect = {
    delimiter: detectedCsvFormat.delimiter,
    quote: detectedCsvFormat.quoteChar || '',
  }
  const parserOptions = {
    to: 100,
    ...csvDialect,
  }

  const records = await parse(csv, parserOptions)

  const [columns, ...fileSample] = records

  return {
    header: columns,
    rows: fileSample,
  }
}
