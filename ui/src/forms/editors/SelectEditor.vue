<template>
  <b-select placeholder="Select" @input="onInput" :value="valueStr">
    <option
      v-for="[option, label] in options"
      :value="option.term.value"
      :key="option.value"
    >
      {{ label }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'

@Component
export default class extends Vue {
  @Prop() property!: PropertyShape
  @Prop() update!: (newValue: string | Term) => void
  @Prop() value?: NamedNode;
  @Prop() options!: [GraphPointer, string][]

  get valueStr (): string {
    return this.value?.value || ''
  }

  onInput (value: string): void {
    const selected = this.options.find(opt => opt[0].value === value)?.[0]
    if (selected) {
      this.update(selected.term)
    }
  }
}
</script>
