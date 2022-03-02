<template>
  <o-select class="select-editor" placeholder="Select" @input="onInput" :value="valueStr">
    <option
      v-for="[option, label] in options"
      :value="option.term.value"
      :key="option.value"
    >
      {{ label }}
    </option>
  </o-select>
</template>

<style scoped>
.select-editor {
  text-overflow:ellipsis
}
</style>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'

export default defineComponent({
  name: 'SelectEditor',
  props: {
    property: {
      type: Object as PropType<PropertyShape>,
      required: true,
    },
    update: {
      type: Function as PropType<(newValue: Term | string) => void>,
      required: true,
    },
    value: {
      type: Object as PropType<NamedNode>,
      default: undefined,
    },
    options: {
      type: Array as PropType<[GraphPointer, string][]>,
      required: true,
    },
  },

  computed: {
    valueStr (): string {
      return this.value?.value || ''
    },
  },

  methods: {
    onInput (value: string): void {
      const selected = this.options.find(opt => opt[0].value === value)?.[0]
      if (selected) {
        this.update(selected.term)
      }
    },
  },
})
</script>
