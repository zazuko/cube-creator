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
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { GraphPointer } from 'clownface'

const projectNS = namespace('project')
const apiNS = namespace('api')

@Component
export default class extends Vue {
  @projectNS.State('project') project!: Project | null
  @apiNS.Getter('publicQueryEndpoint') publicQueryEndpoint!: string | null
  @Prop({ required: true }) term!: Term | RdfResourceCore
  @Prop({ default: false }) showLanguage!: boolean
  @Prop() base?: string

  displayShort = ''

  async mounted (): Promise<void> {
    this.displayShort = this.existingLabel(this.term) || this.commonTerm() || ''

    if (!this.displayShort) {
      this.displayShort = await this.loadCubeResourceName()
        .then(this.sparqlLookup)
        .then(this.dereference)
        .then(this.rawLabel)
        .catch(this.rawLabel) ||
        ''
    }
  }

  get node (): Term {
    if ('id' in this.term) {
      return this.term.id
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

  commonTerm (): string | null {
    const shrunk = shrink(this.node.value)

    return shrunk !== this.node.value ? shrunk : null
  }

  async loadCubeResourceName (): Promise<string | null> {
    if (this.node.termType !== 'NamedNode') {
      return null
    }

    const cubeGraph = this.project?.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const dataUrl = new URL(cubeGraph.value)
    dataUrl.searchParams.append('resource', this.node.value)

    return this.loadLabel(dataUrl.toString())
  }

  async dereference (found: string | null): Promise<string | null> {
    if (found) {
      return found
    }

    if (this.node.termType !== 'NamedNode' || this.node.value.startsWith('http:')) {
      return null
    }

    return this.loadLabel(this.node.value)
  }

  async sparqlLookup (found: string | null): Promise<string | null> {
    if (found) {
      return found
    }

    if (this.node.termType !== 'NamedNode' || !this.publicQueryEndpoint) {
      return null
    }

    const sparqlUrl = new URL(this.publicQueryEndpoint)
    const describe = DESCRIBE`${this.term}`.build()
    sparqlUrl.searchParams.append('query', describe)

    return this.loadLabel(sparqlUrl.toString())
  }

  async loadLabel (url: string): Promise<string | null> {
    const response = await api.fetchResource(url.toString())
    return this.existingLabel(response.pointer.node(this.node))
  }

  existingLabel (resource: Term | RdfResourceCore | GraphPointer): string | null {
    const pointer = 'id' in resource
      ? resource.pointer
      : '_context' in resource
        ? resource
        : null

    if (pointer) {
      return pointer.out([schema.name, rdfs.label], { language: ['en', '*'] }).values[0]
    }

    return null
  }

  rawLabel (found: string | null): string {
    if (typeof found === 'string') {
      return found
    }

    if (this.node.termType === 'NamedNode') {
      return shrink(this.node.value, this.base)
    }

    return this.node.value
  }
}
</script>
