import { describe, it } from 'mocha'
import { expect } from 'chai'
import { parse } from '../../lib/uriTemplateParser'

describe('@cube-creator/model/lib/uriTemplateParser', () => {
  describe('ParsedTemplateWrapper', () => {
    describe('toRegex', () => {
      it('creates pattern which does not match URI with missing segment in the middle', () => {
        // given
        const template = parse('{foo}/{bar}')

        // when
        const regex = new RegExp(template.toRegex('http://example.com'))

        // then
        expect('http://example.com//bar').not.to.match(regex)
      })

      it('creates pattern which does not match URI with missing segment at the end', () => {
        // given
        const template = parse('{foo}/{bar}')

        // when
        const regex = new RegExp(template.toRegex('http://example.com'))

        // then
        expect('http://example.com/foo/').not.to.match(regex)
      })

      it('creates pattern which matches correct URI', () => {
        // given
        const template = parse('{foo}/{bar}')

        // when
        const regex = new RegExp(template.toRegex('http://example.com'))

        // then
        expect('http://example.com/foo/bar').to.match(regex)
      })
    })
  })
})
