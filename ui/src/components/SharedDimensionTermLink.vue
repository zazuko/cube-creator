<template>
  <o-tooltip :label="uri">
    <a :href="uri" target="_blank" rel="noopener noreferer" class="button is-small is-text">
      <o-icon icon="external-link-alt" />
    </a>
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { SharedDimensionTerm } from '../store/types'

export default defineComponent({
  name: 'SharedDimensionTermLink',
  props: {
    term: {
      type: Object as PropType<SharedDimensionTerm>,
      required: true,
    },
  },

  computed: {
    uri (): string {
      return this.term.canonical?.value || this.term.id?.value
    },
  },
})
</script>
