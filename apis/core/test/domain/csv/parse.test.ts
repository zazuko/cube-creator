import { expect } from 'chai'
import { parse } from '../../../lib/domain/csv'

describe('domain/csv/parse', () => {
  it('trims headers', async () => {
    // given
    const input = '"  station_id  ","\tpollutant_id\t","aggregation_id\t","\tlimitvalue","year"'

    // when
    const { header, headerTrimmed } = await parse(input, {})

    // then
    expect(headerTrimmed).to.be.true
    expect(header).to.contain.ordered.members(['station_id', 'pollutant_id', 'aggregation_id', 'limitvalue', 'year'])
  })

  it('parses header', async () => {
    // given
    const input = '"station_id","pollutant_id","aggregation_id","limitvalue","year"'

    // when
    const { header, headerTrimmed } = await parse(input, {})

    // then
    expect(headerTrimmed).to.be.false
    expect(header).to.contain.ordered.members(['station_id', 'pollutant_id', 'aggregation_id', 'limitvalue', 'year'])
  })
})
