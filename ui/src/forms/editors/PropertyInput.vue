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
import { Store } from 'vuex'
import { Term } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { expand, shrink } from '@/rdf-properties'
import store from '../../store'
import { RootState } from '../../store/types'
import { CreateIdentifier } from '../../store/modules/project'
import * as storeNs from '../../store/namespace'

@Component
export default class extends Vue {
  @Prop() value?: Term
  @Prop() update!: (newValue: Term | null) => void

  get $store (): Store<RootState> {
    return store
  }

  set $store (store: Store<RootState>) {
    // Setter is required when using the component directly in the app
    // Do nothing
  }

  @storeNs.project.State((state) => state.createIdentifier) createIdentifier?: CreateIdentifier
  @storeNs.app.State('commonRDFProperties') rdfProperties!: string[]

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
      return this.createIdentifier?.(this.value) || ''
    } else {
      return this.value.value
    }
  }

  get suggestions (): string[] {
    return this.textValue
      ? this.rdfProperties.filter((p) => p.includes(this.textValue))
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
