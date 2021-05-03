<template>
  <b-tooltip :label="displayFull" :active="displayShort !== displayFull">
    {{ displayShort }}<span v-if="showLanguage && term.language" class="has-text-grey-light">@{{ term.language }}</span>
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'
import { api } from '@/api'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { Project } from '@cube-creator/model'
import { namespace } from 'vuex-class'
import { DESCRIBE } from '@tpluscode/sparql-builder'

const projectNS = namespace('project')
const apiNS = namespace('api')

@Component
export default class extends Vue {
  @projectNS.State('project') project!: Project | null
  @apiNS.Getter('publicQueryEndpoint') publicQueryEndpoint!: string | null
  @Prop({ required: true }) term!: Term
  @Prop({ default: false }) showLanguage!: boolean
  @Prop() base?: string

  displayShort = ''

  async mounted (): Promise<void> {
    this.displayShort = await this.commonTerm()
      .then(this.loadCubeResourceName)
      .then(this.dereference)
      .then(this.sparqlLookup)
      .then(this.rawLabel)
      .catch(this.rawLabel) ||
      ''
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

  async commonTerm (): Promise<string | null> {
    const shrunk = shrink(this.term.value)

    return shrunk !== this.term.value ? shrunk : null
  }

  async loadCubeResourceName (found: string | null): Promise<string | null> {
    if (found) {
      return found
    }

    if (this.term.termType !== 'NamedNode') {
      return null
    }

    const cubeGraph = this.project?.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const dataUrl = new URL(cubeGraph.value)
    dataUrl.searchParams.append('resource', this.term.value)

    return this.loadLabel(dataUrl.toString())
  }

  async dereference (found: string | null): Promise<string | null> {
    if (found) {
      return found
    }

    if (this.term.termType !== 'NamedNode' || this.term.value.startsWith('http:')) {
      return null
    }

    return this.loadLabel(this.term.value)
  }

  async sparqlLookup (found: string | null): Promise<string | null> {
    if (found) {
      return found
    }

    if (this.term.termType !== 'NamedNode' || !this.publicQueryEndpoint) {
      return null
    }

    const sparqlUrl = new URL(this.publicQueryEndpoint)
    const describe = DESCRIBE`${this.term}`.build()
    sparqlUrl.searchParams.append('query', describe)

    return this.loadLabel(sparqlUrl.toString())
  }

  async loadLabel (url: string): Promise<string | null> {
    const response = await api.fetchResource(url.toString())
    const resource = response.pointer.node(this.term)

    return resource.out([schema.name, rdfs.label], { language: ['en', '*'] }).values[0]
  }

  rawLabel (found: string | null): string {
    if (typeof found === 'string') {
      return found
    }

    if (this.term.termType === 'NamedNode') {
      return shrink(this.term.value, this.base)
    }

    return this.term.value
  }
}
</script>
