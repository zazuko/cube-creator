<template>
  <span v-if="!term" class="has-text-grey">
    {{ missingValue }}
  </span>
  <span v-else-if="term.termType === 'Literal'">
    {{ term.value }}
    <span v-if="term.language" class="is-small">{{ term.language }}</span>
  </span>
  <span v-else-if="term.termType === 'NamedNode'">
    {{ shrink(term.value) }}
  </span>
  <span v-else>
    {{ term.value }}
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'

@Component
export default class extends Vue {
  @Prop() term?: Term[]
  @Prop({ default: '' }) missingValue?: string

  shrink (value: string): string {
    return shrink(value)
  }
}
</script>
