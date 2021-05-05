<template>
  <term-display :term="pointer || resource.pointer || node" :base="base" @no-label="loadResource" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import TermDisplay from './TermDisplay.vue'
import { api } from '@/api'
import { Project } from '@cube-creator/model'
import { namespace } from 'vuex-class'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'

const projectNS = namespace('project')
const apiNS = namespace('api')

@Component({
  components: { TermDisplay }
})
export default class extends Vue {
  @projectNS.State('project') project!: Project | null
  @apiNS.Getter('publicQueryEndpoint') publicQueryEndpoint!: string | null

  @Prop({ required: true }) resource!: RdfResourceCore | NamedNode
  @Prop() base?: string

  pointer: GraphPointer | null = null

  mounted (): void {
    if ('id' in this.resource) {
      this.pointer = this.resource.pointer
    }
  }

  get node (): Term {
    return 'id' in this.resource ? this.resource.pointer.term : this.resource
  }

  loadResource (): void {
    this.loadCubeResource()
      .then(this.sparqlLookup)
      .then(this.dereference)
      .then(resource => {
        if (resource) {
          this.pointer = resource
        }
      })
  }

  async loadCubeResource (): Promise<GraphPointer | null> {
    if (this.node.termType !== 'NamedNode') {
      return null
    }

    const cubeGraph = this.project?.cubeGraph
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
    console.log(url)
    const resource = await api.fetchResource(url.toString())
    const pointer = resource.pointer.node(this.node)
    if (pointer.out().terms.length === 0) {
      return null
    }

    return pointer
  }
}
</script>
