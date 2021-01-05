<template>
  <b-select placeholder="Select" @input="update" :value="value">
    <option
      v-for="[option, label] in options"
      :value="option.term"
      :key="option.value"
    >
      {{ label }}
    </option>
  </b-select>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import type { PropertyShape } from '@rdfine/shacl'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'

@Component
export default class extends Vue {
  @Prop() property!: PropertyShape
  @Prop() update!: (newValue: string | NamedNode) => void
  @Prop() value?: NamedNode;
  @Prop() options!: [GraphPointer, string][]
}
</script>
