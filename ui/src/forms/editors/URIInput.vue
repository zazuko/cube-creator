<template>
  <b-field :message="message">
    <b-input :value="textValue" @blur="onUpdate" />
  </b-field>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { NamedNode } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { api } from '@/api'
import { rdfs, schema, skos } from '@tpluscode/rdf-ns-builders/strict'
import { debounce } from 'debounce'
import { supportedLanguages } from '@cube-creator/core/languages'

const language = supportedLanguages.map(({ value }) => value)

@Component
export default class extends Vue {
  @Prop() value?: NamedNode | null;
  @Prop() update!: (newValue: NamedNode | null) => void

  message = ''

  get textValue (): string {
    return this.value?.value || ''
  }

  mounted () {
    this.__fetch()
  }

  onUpdate (e: any): void {
    const newValue = e.target.value

    try {
      const url = new URL(newValue)

      const newTerm = $rdf.namedNode(url.toString())

      this.update(newTerm)
      this.__fetch()
    } catch (e) {
      this.message = ''
    }
  }

  async __fetch () {
    if (!this.value) {
      return
    }

    this.message = '...'
    api.fetchResource(this.value.value)
      .then(resource => {
        [this.message] = resource.pointer.out(
          [schema.name, skos.prefLabel, rdfs.label],
          { language }
        ).values
      })
      .catch(() => {
        this.message = ''
      })
  }
}
</script>
