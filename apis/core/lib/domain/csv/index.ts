import CSVparse from 'csv-parse'
import CSVSniffer from 'csv-sniffer'

const csvDelimiters = [',', ';', '\t']
const sniffer = new (CSVSniffer())(csvDelimiters)

export function parse(csv: string, options: CSVparse.Options): Promise<{ header: any[]; rows: any[] }> {
  return new Promise((resolve, reject) => CSVparse(csv, options, (err, records) => {
    if (err) {
      reject(err)
      return
    }
    const [header, ...rows] = records
    resolve({
      header,
      rows,
    })
  }))
}

export async function sniffParse(csv: string): Promise<{ dialect: {delimiter: string; quote: string}; header: any[]; rows: any[] }> {
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
