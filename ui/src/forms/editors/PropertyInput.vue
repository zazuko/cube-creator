<template>
  <o-field :message="fullURI">
    <o-autocomplete
      :value="textValue"
      @input="onUpdate"
      :data="suggestions"
    />
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Term } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { expand, shrink } from '@/rdf-properties'
import store from '../../store'
import { CreateIdentifier } from '../../store/modules/project'

export default defineComponent({
  name: 'PropertyInput',
  props: {
    value: {
      type: Object as PropType<Term>,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: Term | null) => void>,
      required: true,
    },
  },

  computed: {
    createIdentifier (): CreateIdentifier | null {
      return store.state.project.createIdentifier
    },

    rdfProperties (): string[] {
      return store.state.app.commonRDFProperties
    },

    textValue (): string {
      if (!this.value) {
        return ''
      }

      if (this.value.termType === 'Literal') {
        return this.value.value
      } else {
        return shrink(this.value.value)
      }
    },

    fullURI (): string {
      if (!this.value?.value) {
        return ''
      }

      if (this.value.termType === 'Literal') {
        return this.createIdentifier?.(this.value) || ''
      } else {
        return this.value.value
      }
    },

    suggestions (): string[] {
      return this.textValue
        ? this.rdfProperties.filter((p) => p.includes(this.textValue))
        : []
    },
  },

  methods: {
    onUpdate (newValue: string): void {
      const expanded = expand(newValue)

      const newTerm = expanded.startsWith('http')
        ? $rdf.namedNode(expanded)
        : $rdf.literal(newValue)

      this.update(newTerm)
    },
  },
})
</script>
