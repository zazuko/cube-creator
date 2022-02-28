<template>
  <o-tooltip :label="displayFull" :active="displayShort !== displayFull">
    {{ displayShort }}<span v-if="showLanguage && term.language" class="has-text-grey-light">@{{ term.language }}</span>
  </o-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Literal, Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'
import { xsd } from '@tpluscode/rdf-ns-builders'

@Component
export default class extends Vue {
  @Prop({ required: true }) term!: Term
  @Prop({ default: false }) showLanguage!: boolean
  @Prop() base?: string

  get displayShort (): string {
    return this.__commonTermPrefixes || this.__rawLabel
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

  get __commonTermPrefixes (): string | null {
    const shrunk = shrink(this.term.value)

    return shrunk !== this.term.value ? shrunk : null
  }

  get __rawLabel (): string {
    if (this.term.termType === 'NamedNode') {
      return shrink(this.term.value, this.base)
    }

    if (this.term.termType === 'Literal') {
      return formatLiteral(this.term)
    }

    return this.term.value
  }
}

function formatLiteral (term: Literal): string {
  if (xsd.dateTime.equals(term.datatype)) {
    return new Date(term.value).toLocaleString()
  }

  return term.value
}
</script>
