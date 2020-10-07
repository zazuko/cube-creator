import { describe, it } from 'mocha'
import { expect } from 'chai'
import { promises as fs } from 'fs'
import { resolve } from 'path'
import { sniffParse } from '../../../lib/domain/csv'
import { saveFile, loadFile } from '../../../lib/storage/s3'

describe('domain/csv/parse', () => {
  it('sniffs and parses', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const input = await fs.readFile(path)
    const { header, rows } = await sniffParse(input.toString())
    const [lastRow] = rows.slice(-1)

    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })

  it('reads from s3', async () => {
    const path = resolve(__dirname, '../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const fileContent = await fs.readFile(path)
    await saveFile('test/CH_yearly_air_immission_aggregation_id.csv', fileContent.toString())
    const input = await loadFile('test/CH_yearly_air_immission_aggregation_id.csv')

    const { header, rows } = await sniffParse(input)
    const [lastRow] = rows.slice(-1)

    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })
})
