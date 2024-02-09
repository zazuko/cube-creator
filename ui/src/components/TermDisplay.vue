<template>
  <o-tooltip :label="displayFull" :active="displayShort !== displayFull">
    {{ displayShort }}<span v-if="showLanguage && term.language" class="has-text-grey-light">@{{ term.language }}</span>
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Literal, Term } from '@rdfjs/types'
import { shrink } from '@/rdf-properties'
import { xsd } from '@tpluscode/rdf-ns-builders'

export default defineComponent({
  name: 'TermDisplay',
  props: {
    term: {
      type: Object as PropType<Term>,
      required: true,
    },
    showLanguage: {
      type: Boolean,
      default: false,
    },
    base: {
      type: String,
      default: undefined,
    },
  },

  computed: {
    displayShort (): string {
      return this.__commonTermPrefixes || this.__rawLabel
    },

    displayFull (): string {
      if (this.term.termType === 'Literal') {
        const datatype = this.term.datatype ? `^^${shrink(this.term.datatype.value)}` : ''
        const language = this.term.language ? `@${this.term.language}` : ''

        return `"${this.term.value}${language}"${datatype}`
      } else {
        return this.term.value
      }
    },

    __commonTermPrefixes (): string | null {
      const shrunk = shrink(this.term.value)

      return shrunk !== this.term.value ? shrunk : null
    },

    __rawLabel (): string {
      if (this.term.termType === 'NamedNode') {
        return shrink(this.term.value, this.base)
      }

      if (this.term.termType === 'Literal') {
        return formatLiteral(this.term)
      }

      return this.term.value
    },
  },
})

function formatLiteral (term: Literal): string {
  if (xsd.dateTime.equals(term.datatype)) {
    return new Date(term.value).toLocaleString()
  }

  return term.value
}
</script>
