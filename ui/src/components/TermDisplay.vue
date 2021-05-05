<template>
  <b-tooltip :label="displayFull" :active="displayShort !== displayFull">
    {{ displayShort }}<span v-if="showLanguage && term.language" class="has-text-grey-light">@{{ term.language }}</span>
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'

@Component
export default class extends Vue {
  @Prop({ required: true }) term!: Term | GraphPointer
  @Prop({ default: false }) showLanguage!: boolean
  @Prop() base?: string

  get displayShort () {
    return this.__schemaName || this.__commonTermPrefixes || this.__rawLabel
  }

  mounted (): void {
    const label = this.__schemaName || this.__commonTermPrefixes
    if (!label) {
      this.$emit('no-label')
    }
  }

  get node (): Term {
    if ('_context' in this.term) {
      return this.term.term
    }
    return this.term
  }

  get displayFull (): string {
    if (this.node.termType === 'Literal') {
      const datatype = this.node.datatype ? `^^${shrink(this.node.datatype.value)}` : ''
      const language = this.node.language ? `@${this.node.language}` : ''

      return `"${this.node.value}${language}"${datatype}`
    } else {
      return this.node.value
    }
  }

  get __commonTermPrefixes (): string | null {
    const shrunk = shrink(this.node.value)

    return shrunk !== this.node.value ? shrunk : null
  }

  get __schemaName (): string | null {
    const pointer = '_context' in this.term
      ? this.term
      : null

    if (pointer) {
      return pointer.out([schema.name, rdfs.label], { language: ['en', '*'] }).values[0]
    }

    return null
  }

  get __rawLabel (): string {
    if (this.node.termType === 'NamedNode') {
      return shrink(this.node.value, this.base)
    }

    return this.node.value
  }
}
</script>
