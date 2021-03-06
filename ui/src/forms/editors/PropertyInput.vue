<template>
  <b-field :message="fullURI">
    <b-autocomplete
      :value="textValue"
      @input="onUpdate"
      :data="suggestions"
    />
  </b-field>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Store } from 'vuex'
import { Term } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import store from '@/store'
import { RootState } from '@/store/types'
import { expand, shrink } from '@/rdf-properties'
import { CreateIdentifier } from '@/store/modules/project'

const projectNS = namespace('project')
const appNS = namespace('app')

@Component
export default class extends Vue {
  @Prop() value?: Term;
  @Prop() update!: (newValue: Term | null) => void

  get $store (): Store<RootState> {
    return store
  }

  set $store (store: Store<RootState>) {
    // Setter is required when using the component directly in the app
    // Do nothing
  }

  @projectNS.State((state) => state.createIdentifier) createIdentifier!: CreateIdentifier
  @appNS.State('commonRDFProperties') rdfProperties!: string[]

  get textValue (): string {
    if (!this.value) {
      return ''
    }

    if (this.value.termType === 'Literal') {
      return this.value.value
    } else {
      return shrink(this.value.value)
    }
  }

  get fullURI (): string {
    if (!this.value?.value) {
      return ''
    }

    if (this.value.termType === 'Literal') {
      return this.createIdentifier(this.value)
    } else {
      return this.value.value
    }
  }

  get suggestions (): string[] {
    return this.textValue
      ? this.rdfProperties.filter((p) => p.startsWith(this.textValue))
      : []
  }

  onUpdate (newValue: string): void {
    const expanded = expand(newValue)

    const newTerm = expanded.startsWith('http')
      ? $rdf.namedNode(expanded)
      : $rdf.literal(newValue)

    this.update(newTerm)
  }
}
</script>
