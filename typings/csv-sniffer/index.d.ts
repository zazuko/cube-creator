declare module 'csv-sniffer' {
  interface Options {
    delimiter?: string
    hasHeader?: boolean
    newlineStr?: string
    quoteChar?: string
  }

  interface SniffResult {
    delimiter: string
    hasHeader: boolean
    labels: string | null
    newlineStr: string
    quoteChar: string
    records: any[]
    types: any[]
    warnings: string[]
  }

  class CSVSniffer {
    public constructor(delimiters: string[])
    public sniff (sample: string, options?: Options): SniffResult
  }

  function CSVSnifferFactory(): typeof CSVSniffer

  export = CSVSnifferFactory
}
