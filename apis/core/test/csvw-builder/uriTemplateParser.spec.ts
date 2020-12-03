import { describe, it } from 'mocha'
import { expect } from 'chai'
import { parse } from '../../lib/csvw-builder/uriTemplateParser'

describe('uriTemplateParser', () => {
  describe('parse', () => {
    it('parses simple template', () => {
      // given
      const template = '/{column1}/{column2}'

      // when
      const parsed = parse(template)

      // then
      expect(parsed.toString()).toEqual('/{column1}/{column2}')
      expect(parsed.columnNames).toEqual(
        expect.arrayContaining(['column1', 'column2'])
      )
    })

    it('accepts spaces in column names', () => {
      // given
      const template = '/{column one}/{column two}'

      // when
      const parsed = parse(template)

      // then
      expect(parsed.toString()).toEqual('/{column one}/{column two}')
      expect(parsed.columnNames).toEqual(
        expect.arrayContaining(['column one', 'column two'])
      )
    })
  })

  describe('renameColumnVariable', () => {
    it('encodes the replacement', () => {
      // given
      const template = '/{from}'
      const parsed = parse(template)

      // when
      const success = parsed.renameColumnVariable('from', 'with spaces')

      // then
      expect(success).toBe(true)
      expect(parsed.toString()).toEqual('/{with spaces}')
      expect(parsed.columnNames).toEqual(
        expect.arrayContaining(['with spaces'])
      )
    })
  })
})
