<template>
  <o-select class="select-editor" placeholder="Select" @update:modelValue="onInput" :model-value="valueStr">
    <option
      v-for="option in options"
      :value="option.term.value"
      :key="option.value"
    >
      {{ label(option) }}
    </option>
  </o-select>
</template>

<style scoped>
.select-editor {
  text-overflow:ellipsis
}
</style>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Term, NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import '@/components/tagged-literal'
import { getLocalizedLabel } from '@rdfjs-elements/lit-helpers'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'

export default defineComponent({
  name: 'SelectEditor',
  props: {
    update: {
      type: Function as PropType<(newValue: Term | string) => void>,
      required: true,
    },
    value: {
      type: Object as PropType<NamedNode>,
      default: undefined,
    },
    options: {
      type: Array as PropType<GraphPointer[]>,
      default: () => [],
    },
  },

  computed: {
    valueStr (): string {
      return this.value?.value || ''
    },
  },

  methods: {
    onInput (value: string): void {
      const selected = this.options.find(opt => opt.value === value)
      if (selected) {
        this.update(selected.term)
      }
    },

    label (pointer: GraphPointer) {
      return getLocalizedLabel(pointer.out([rdfs.label, schema.name])) || pointer.value
    }
  },
})
</script>

<style>
select-editor .control.select {
   width: 100%;
}
</style>
