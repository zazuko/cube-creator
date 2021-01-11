import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createReadStream, promises as fs } from 'fs'
import { resolve } from 'path'
import { sniffParse } from '../../../lib/domain/csv'
import { loadFileHeadString } from '../../../lib/domain/csv/file-head'

describe('domain/csv/parse', () => {
  it('sniffs and parses', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const input = await fs.readFile(path)
    const { dialect, header, rows } = await sniffParse(input.toString())
    const [lastRow] = rows.slice(-1)

    expect(dialect).to.contain({ delimiter: ',', quote: '"' })
    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })

  it('reads parts of a file ', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_basetable.csv')
    const fileContent = await fs.readFile(path)

    const input1 = fileContent.toString()
    const input2 = await loadFileHeadString(createReadStream(path))

    expect(input1).not.to.eq(input2)

    const lines1 = input1?.split('\n') || []
    const lines2 = input2?.split('\n') || []
    const firstLine2 = lines2[0]
    expect(lines1[0]).to.eq(firstLine2)
    expect(lines2.length).to.eq(21)
  })

  it('parses all lines on short file', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_unit_id.csv')

    const input = await loadFileHeadString(createReadStream(path))
    const lines = input?.split('\n') || []
    expect(lines.length).be.eq(11)
  })
})
