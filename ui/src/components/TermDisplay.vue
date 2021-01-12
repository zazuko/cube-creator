<template>
  <b-tooltip :label="displayFull" :active="displayShort !== displayFull">
    {{ displayShort }}<span v-if="showLanguage && term.language" class="has-text-grey-light">@{{ term.language }}</span>
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'

@Component
export default class extends Vue {
  @Prop({ required: true }) term!: Term
  @Prop({ default: false }) showLanguage!: boolean

  get displayShort (): string {
    if (this.term.termType === 'NamedNode') {
      return shrink(this.term.value)
    } else {
      return this.term.value
    }
  }

  get displayFull (): string {
    if (this.term.termType === 'Literal') {
      const datatype = this.term.datatype ? `^^${shrink(this.term.datatype.value)}` : ''
      const language = this.term.language ? `@${this.term.language}` : ''

      return `"${this.term.value}${language}"${datatype}`
    } else {
      return this.term.value
    }
  }
}
</script>
