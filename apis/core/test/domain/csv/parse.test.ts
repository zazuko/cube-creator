import { describe, it } from 'mocha'
import { expect } from 'chai'
import { promises as fs } from 'fs'
import { resolve } from 'path'

import { sniffParse } from '../../../lib/domain/csv'

describe('domain/cube-projects/create', () => {
  it('creates identifier by slugifying rdfs:label', async () => {
    const path = resolve(__dirname, '/../../fixtures/CH_yearly_air_immission_aggregation_id.csv')
    const input = await fs.readFile(path)
    const { header, rows } = await sniffParse(input.toString())
    const [lastRow] = rows.slice(-1)

    expect(header).to.deep.eq(['aggregation_id', 'aggregation_name_de', 'aggregation_name_fr', 'aggregation_name_it', 'aggregation_name_en'])
    expect(lastRow).to.deep.eq(['dosisaot40f', 'Dosis AOT40f', 'Dose AOT40f', 'Dose AOT40f', 'Dosis AOT40f'])
  })
})
