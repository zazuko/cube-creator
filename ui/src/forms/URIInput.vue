<template>
  <b-input :value="textValue" @input="onUpdate" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { NamedNode } from 'rdf-js'
import $rdf from '@rdfjs/data-model'

@Component
export default class extends Vue {
  @Prop() value?: NamedNode | null;
  @Prop() update!: (newValue: NamedNode | null) => void

  get textValue (): string {
    return this.value?.value || ''
  }

  onUpdate (newValue: string): void {
    const newTerm = $rdf.namedNode(newValue)

    this.update(newTerm)
  }
}
</script>
