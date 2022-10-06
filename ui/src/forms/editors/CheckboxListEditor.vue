<template>
  <o-field :addons="false">
    <o-checkbox
      v-for="[term, label] in choices"
      :key="term.value"
      :native-value="term.value"
      v-model="selected"
      @update:modelValue="emit"
    >
      <span>{{ label }}</span>
    </o-checkbox>
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Term } from 'rdf-js'
import { namedNode } from '@rdf-esm/data-model'

export default defineComponent({
  name: 'CheckboxListEditor',
  props: {
    choices: {
      type: Array as PropType<[Term, string][]>,
      required: true,
    },
    value: {
      type: Array as PropType<Term[]>,
      required: true,
    },
    update: {
      type: Function as PropType<(newValue: Term[]) => void>,
      required: true,
    }
  },

  data (): { selected: string[] } {
    return {
      selected: []
    }
  },

  mounted (): void {
    this.selected = this.value.map(v => v.value)
  },

  methods: {
    emit (): void {
      this.update(this.selected.map(namedNode))
    },
  },
})
</script>
