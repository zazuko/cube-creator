<template>
  <o-tooltip :label="expanded">
    {{ shrunk }}
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Term } from '@rdfjs/types'
import { shrink } from '@/rdf-properties'
import { CreateIdentifier } from '../store/modules/project'

export default defineComponent({
  name: 'PropertyDisplay',
  props: {
    term: {
      type: Object as PropType<Term>,
      required: true,
    }
  },

  computed: {
    createIdentifier (): CreateIdentifier | null {
      return this.$store.state.project.createIdentifier
    },

    value (): string {
      return this.term.value || ''
    },

    expanded (): string {
      return this.createIdentifier
        ? this.createIdentifier(this.term)
        : this.term.value
    },

    shrunk (): string {
      return shrink(this.value)
    },
  },
})
</script>
