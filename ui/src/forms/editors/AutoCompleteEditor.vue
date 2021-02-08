<template>
  <multi-select
    placeholder="Select"
    @input="onInput"
    :value="_value"
    :options="_options"
    label="label"
    track-by="value"
    :allow-empty="false"
    close-on-select
  />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import MultiSelect from 'vue-multiselect'

interface Option {
  label: string
  value: string
  term: Term
}

@Component({
  components: { MultiSelect },
})
export default class extends Vue {
  @Prop() property!: PropertyShape
  @Prop() update!: (newValue: Term | null) => void
  @Prop() value?: NamedNode;
  @Prop() options!: [GraphPointer, string][]

  get _options (): Option[] {
    return this.options.map(([pointer, label]) => ({ value: pointer.term.value, label, term: pointer.term }))
  }

  get _value (): Option | null {
    return this._options.find(({ value }) => value === this.value?.value) ?? null
  }

  onInput (value: Option | null): void {
    this.update(value?.term ?? null)
  }
}
</script>
