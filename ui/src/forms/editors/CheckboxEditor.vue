<template>
  <o-checkbox :model-value="value" @update:modelValue="emit" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Term } from '@rdfjs/types'
import { literal } from '@rdf-esm/data-model'
import { xsd } from '@tpluscode/rdf-ns-builders'

export default defineComponent({
  name: 'CheckboxEditor',
  props: {
    value: {
      type: Boolean,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: Term | string) => void>,
      required: true,
    }
  },

  methods: {
    emit (value: boolean): void {
      this.update(literal(value.toString(), xsd.boolean))
    },
  },
})
</script>
