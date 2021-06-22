<template>
  <vue-select
    :placeholder="placeholder"
    :options="_options"
    label="label"
    :value="_value"
    @input="onInput"
    :clearable="false"
    :filterable="filterable"
    @search="onSearch"
    @search:focus="__load"
    :clear-search-on-blur="clearOnBlur"
  />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import type { PropertyShape } from '@rdfine/shacl'
import { Term, NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import VueSelect from 'vue-select'

interface Option {
  label: string
  value: string
  term: Term
}

@Component({
  components: { VueSelect },
})
export default class extends Vue {
  @Prop() property!: PropertyShape
  @Prop() update!: (newValue: Term | null) => void
  @Prop() value?: NamedNode;
  @Prop() placeholder!: string;
  @Prop() filterable?: boolean;
  @Prop() options?: [GraphPointer, string][]

  searchValue = ''

  get _options (): Option[] {
    const options = this.options ?? []
    return options.map(([pointer, label]) => ({ value: pointer.term.value, label, term: pointer.term }))
  }

  get _value (): Option | null {
    return this._options.find(({ value }) => value === this.value?.value) ?? null
  }

  onInput (value: Option | null): void {
    this.update(value?.term ?? null)
  }

  onSearch (freetextQuery: string, loading: () => void): void {
    this.searchValue = freetextQuery
    this.$emit('search', freetextQuery, loading)
  }

  clearOnBlur (): boolean {
    return false
  }

  __load (): void {
    this.$emit('search', this.searchValue)
  }
}
</script>
