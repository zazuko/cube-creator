<template>
  <term-with-language :values="labels" :selected-language="selectedLanguage">
    <term-display :term="node" :base="base" />
  </term-with-language>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import TermDisplay from './TermDisplay.vue'
import { api } from '@/api'
import { Project } from '@cube-creator/model'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { GraphPointer } from 'clownface'
import { Literal, NamedNode, Term } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { TermWithLanguage, TermDisplay }
})
export default class extends Vue {
  @storeNs.project.State('project') project!: Project | null
  @storeNs.api.Getter('publicQueryEndpoint') publicQueryEndpoint!: string | null

  @Prop({ required: true }) resource!: RdfResourceCore | NamedNode
  @Prop({ default: 'en' }) selectedLanguage!: string
  @Prop() base?: string

  labels: Literal [] = []

  mounted (): void {
    if ('id' in this.resource) {
      this.labels = this.getLabels(this.resource.pointer)
    }

    if (!this.labels.length) {
      this.loadResource()
    }
  }

  get node (): Term {
    return 'id' in this.resource ? this.resource.pointer.term : this.resource
  }

  getLabels (pointer: GraphPointer | null): Literal[] {
    if (pointer) {
      return pointer.out(schema.name).terms.filter(isLiteral) as Literal[]
    }

    return []
  }

  loadResource (): void {
    this.loadCubeResource()
      .then(this.sparqlLookup)
      .then(this.dereference)
      .then(resource => {
        this.labels = this.getLabels(resource)
      })
  }

  async loadCubeResource (): Promise<GraphPointer | null> {
    if (!this.project) {
      return null
    }

    if (this.node.termType !== 'NamedNode') {
      return null
    }

    const cubeGraph = this.project.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const dataUrl = new URL(cubeGraph.value)
    dataUrl.searchParams.append('resource', this.node.value)

    return this.__fetch(dataUrl.toString())
  }

  async dereference (found: GraphPointer | null): Promise<GraphPointer | null> {
    if (found) {
      return found
    }

    if (this.node.termType !== 'NamedNode' || this.node.value.startsWith('http:')) {
      return null
    }

    return this.__fetch(this.node.value)
  }

  async sparqlLookup (found: GraphPointer | null): Promise<GraphPointer | null> {
    if (found) {
      return found
    }

    if (this.node.termType !== 'NamedNode' || !this.publicQueryEndpoint) {
      return null
    }

    const sparqlUrl = new URL(this.publicQueryEndpoint)
    const describe = DESCRIBE`${this.node}`.build()
    sparqlUrl.searchParams.append('query', describe)

    return this.__fetch(sparqlUrl.toString())
  }

  async __fetch (url: string): Promise<GraphPointer | null> {
    try {
      const resource = await api.fetchResource(url.toString())
      const pointer = resource.pointer.node(this.node)
      if (this.getLabels(pointer).length === 0) {
        return null
      }

      return pointer
    } catch (e) {
      return null
    }
  }
}

function isLiteral (term: Term): term is Literal {
  return term.termType === 'Literal'
}
</script>
