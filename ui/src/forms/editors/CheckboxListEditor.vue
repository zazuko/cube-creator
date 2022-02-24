<template>
  <b-field>
    <b-checkbox-button
      v-for="[term, label] in choices"
      :key="term.value"
      :native-value="term.value"
      v-model="selected"
      @input="emit"
    >
      <span>{{ label }}</span>
    </b-checkbox-button>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { namedNode } from '@rdf-esm/data-model'

@Component
export default class extends Vue {
  @Prop() choices!: [Term, string][]
  @Prop() value!: Term[]
  @Prop() update!: (newValue: Term[]) => void

  selected: string[] = []

  mounted (): void {
    this.selected = this.value.map(v => v.value)
  }

  emit (): void {
    this.update(this.selected.map(namedNode))
  }
}
</script>
