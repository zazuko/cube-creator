<template>
  <o-checkbox :model-value="value" @update:modelValue="emit" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Term } from '@rdfjs/types'
import $rdf from '@cube-creator/env'
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
      this.update($rdf.literal(value.toString(), xsd.boolean))
    },
  },
})
</script>
