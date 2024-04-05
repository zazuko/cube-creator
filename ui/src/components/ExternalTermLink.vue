<template>
  <o-tooltip @click.stop="() => {}" :label="uri">
    <a :href="uri" target="_blank" rel="noopener noreferer" class="button is-small is-text">
      <o-icon icon="external-link-alt" />
    </a>
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { SharedDimensionTerm } from '../store/types'
import type { NamedNode } from '@rdfjs/types'

export default defineComponent({
  name: 'ExternalTermLink',
  props: {
    term: {
      type: Object as PropType<SharedDimensionTerm | NamedNode>,
      required: true,
    },
  },

  computed: {
    uri (): string {
      if ('termType' in this.term) {
        return this.term.value
      }

      return this.term.canonical?.value || this.term.id?.value
    },
  },
})
</script>
