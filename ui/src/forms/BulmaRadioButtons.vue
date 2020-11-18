<template>
  <b-field :message="message">
    <b-radio-button
      v-for="option in choices"
      :key="option.value"
      :value="_value"
      :native-value="option.value"
      @input="emit"
    >
      {{ label(option) }}
    </b-radio-button>
  </b-field>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { GraphPointer, MultiPointer } from 'clownface'
import { Term } from 'rdf-js'
import { rdfs } from '@tpluscode/rdf-ns-builders'

@Component
export default class extends Vue {
  @Prop() options?: MultiPointer;
  @Prop() value?: GraphPointer;
  @Prop() update!: (newValue: Term | string) => void;

  get _value (): string {
    return this.value?.value || ''
  }

  get choices (): Term[] {
    return this.options?.terms ?? []
  }

  get message (): string {
    if (this.value) {
      return this.options?.node(this.value).out(rdfs.comment).values[0] || ''
    }

    return ''
  }

  label (value: Term): string {
    return this.options?.node(value).out(rdfs.label).values[0] || value.value
  }

  emit (value: string): void {
    this.update(value)
  }
}
</script>
