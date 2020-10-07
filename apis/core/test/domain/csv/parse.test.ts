import { describe, it } from 'mocha'
import { expect } from 'chai'
import { promises as fs } from 'fs'
import { resolve } from 'path'
import { sniffParse } from '../../../lib/domain/csv'
import { saveFile, loadFileString, loadFileHeadString } from '../../../lib/storage/s3'

describe('domain/csv/parse', () => {
  it('sniffs and parses', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const input = await fs.readFile(path)
    const { dialect, header, rows } = await sniffParse(input.toString())
    const [lastRow] = rows.slice(-1)

    expect(dialect).to.deep.eq({ delimiter: ',', quote: '"' })
    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })

  it('reads from s3', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const fileContent = await fs.readFile(path)
    await saveFile('test/CH_yearly_air_immission_aggregation_id.csv', fileContent.toString())
    const input = await loadFileString('test/CH_yearly_air_immission_aggregation_id.csv')

    const { header, rows } = await sniffParse(String(input))
    const [lastRow] = rows.slice(-1)

    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })

  it('reads parts of a file from s3', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_basetable.csv')
    const fileContent = await fs.readFile(path)
    await saveFile('test/CH_yearly_air_immission_basetable.csv', fileContent.toString())

    const input1 = await loadFileString('test/CH_yearly_air_immission_basetable.csv')
    const input2 = await loadFileHeadString('test/CH_yearly_air_immission_basetable.csv')

    expect(input1).not.to.eq(input2)

    const lines1 = input1?.split('\n') || []
    const [firstLine2] = input2?.split('\n')
    expect(lines1[0]).to.eq(firstLine2)
  })
})
