<template>
  <o-field :message="message">
    <o-input :model-value="textValue" @blur="onUpdate" />
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { NamedNode } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { api } from '@/api'
import { rdfs, schema, skos } from '@tpluscode/rdf-ns-builders/strict'
import { supportedLanguages } from '@cube-creator/core/languages'

const language = supportedLanguages.map(({ value }) => value)

export default defineComponent({
  name: 'URIInput',
  props: {
    value: {
      type: Object as PropType<NamedNode | null>,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: NamedNode | null) => void>,
      required: true,
    },
  },

  data () {
    return {
      message: '',
    }
  },

  mounted (): void {
    this.__fetch()
  },

  computed: {
    textValue (): string {
      return this.value?.value || ''
    },
  },

  methods: {
    onUpdate (e: Event): void {
      const newValue = (e.target as HTMLInputElement).value

      try {
        const url = new URL(newValue)

        const newTerm = $rdf.namedNode(url.toString())

        this.update(newTerm)
        this.__fetch()
      } catch (e) {
        this.message = ''
      }
    },

    async __fetch (): Promise<void> {
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
    },
  },
})
</script>
