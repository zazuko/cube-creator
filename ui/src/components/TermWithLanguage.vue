<template>
  <span v-if="value">{{ value }}</span>
  <span v-else><slot>Missing value</slot></span>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Literal } from 'rdf-js'

export default defineComponent({
  name: 'TermWithLanguage',
  props: {
    values: {
      type: Array as PropType<Literal[]>,
      default: undefined,
    },
    selectedLanguage: {
      type: String,
      required: true,
    },
  },

  computed: {
    value (): string | undefined {
      const term =
        this.values?.find(({ language }) => language === this.selectedLanguage) ||
        this.values?.find(({ language }) => !language)

      return term?.value
    },
  },
})
</script>
