<template>
  <span v-if="value">{{ value }}</span>
  <span v-else><slot>Missing value</slot></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Literal } from '@rdfjs/types'
import { MultiPointer } from 'clownface'
import { taggedLiteral } from 'clownface/filter'
import { displayLanguage } from '@/store/serializers'

export default defineComponent({
  name: 'TermWithLanguage',
  props: {
    values: {
      type: Object as PropType<MultiPointer<Literal> | Literal[]>,
      default: undefined,
    },
    selectedLanguage: {
      type: String,
      required: true,
    },
  },

  computed: {
    value (): string | undefined {
      if (Array.isArray(this.values)) {
        let term =
          this.values?.find(({ language }) => language === this.selectedLanguage) ||
          this.values?.find(({ language }) => !language)
        if (term) return term.value

        for (const lang of displayLanguage) {
          term = this.values?.find(({ language }) => language === lang)
          if (term) return `${term.value} (${term.language})`
        }

        return undefined
      }

      const term = this.values?.filter(taggedLiteral([
        this.selectedLanguage,
        ...displayLanguage,
        '*'
      ]))

      return term?.value
    },
  },
})
</script>
