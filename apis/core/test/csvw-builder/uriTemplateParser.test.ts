import { describe, it } from 'mocha'
import { expect } from 'chai'
import { parse } from '@cube-creator/model/lib/uriTemplateParser'

describe('uriTemplateParser', () => {
  describe('parse', () => {
    it('parses simple template', () => {
      // given
      const template = '/{column1}/{column2}'

      // when
      const parsed = parse(template)

      // then
      expect(parsed.toString()).to.equal('/{column1}/{column2}')
      expect(parsed.columnNames).to.have.members(['column1', 'column2'])
    })

    it('accepts spaces in column names', () => {
      // given
      const template = '/{column one}/{column two}'

      // when
      const parsed = parse(template)

      // then
      expect(parsed.toString()).to.equal('/{column one}/{column two}')
      expect(parsed.columnNames).to.have.members(['column one', 'column two'])
    })

    it('accepts apostrophe in column names', () => {
      // given
      const template = "/{column'one}/{column'two}"

      // when
      const parsed = parse(template)

      // then
      expect(parsed.toString()).to.equal("/{column'one}/{column'two}")
      expect(parsed.columnNames).to.have.members(["column'one", "column'two"])
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
      expect(success).to.equal(true)
      expect(parsed.toString()).to.equal('/{with spaces}')
      expect(parsed.columnNames).to.have.members(['with spaces'])
    })
  })
})
