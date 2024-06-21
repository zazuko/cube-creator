<template>
  <term-with-language :values="labels" :selected-language="selectedLanguage">
    <term-display :term="node" :base="base" />
  </term-with-language>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import TermDisplay from './TermDisplay.vue'
import { api } from '@/api'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import type { GraphPointer, MultiPointer } from 'clownface'
import type { Literal, NamedNode, Term } from '@rdfjs/types'
import { schema } from '@tpluscode/rdf-ns-builders'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'ExternalTerm',
  components: { TermWithLanguage, TermDisplay },
  props: {
    resource: {
      type: Object as PropType<GraphPointer | RdfResourceCore | NamedNode>,
      required: true,
    },
    selectedLanguage: {
      type: String,
      default: 'en',
    },
    base: {
      type: String,
      default: undefined,
    },
  },

  data (): { labels?: MultiPointer<Literal> } {
    return {
      labels: undefined,
    }
  },

  mounted (): void {
    if (isGraphPointer(this.resource)) {
      this.labels = getLabels(this.resource)
    } else if ('id' in this.resource) {
      this.labels = getLabels(this.resource.pointer)
    }

    if (!this.labels?.terms.length) {
      this.loadResource()
    }
  },

  computed: {
    ...mapState('api', [
      'publicQueryEndpoint',
    ]),
    ...mapState('project', {
      project: 'project',
    }),

    node (): Term {
      if (isGraphPointer(this.resource)) {
        return this.resource.term
      } else if ('id' in this.resource) {
        return this.resource.pointer.term
      } else {
        return this.resource
      }
    },
  },

  methods: {
    loadResource (): void {
      this.loadCubeResource()
        .then(this.sparqlLookup)
        .then(this.dereference)
        .then(resource => {
          this.labels = getLabels(resource)
        })
    },

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
    },

    async dereference (found: GraphPointer | null): Promise<GraphPointer | null> {
      if (found) {
        return found
      }

      if (this.node.termType !== 'NamedNode' || this.node.value.startsWith('http:')) {
        return null
      }

      return this.__fetch(this.node.value)
    },

    async sparqlLookup (found: GraphPointer | null): Promise<GraphPointer | null> {
      if (found) {
        return found
      }

      if (this.node.termType !== 'NamedNode' || !this.publicQueryEndpoint) {
        return null
      }

      const endpoint = this.publicQueryEndpoint as string
      const sparqlUrl = new URL(endpoint)
      const describe = DESCRIBE`${this.node}`.build()
      sparqlUrl.searchParams.append('query', describe)

      return this.__fetch(sparqlUrl.toString())
    },

    async __fetch (url: string): Promise<GraphPointer | null> {
      try {
        const resource = await api.fetchResource(url.toString())
        const pointer = resource.pointer.node(this.node)
        const labels = getLabels(pointer)
        if (!labels || labels.terms.length === 0) {
          return null
        }

        return pointer
      } catch (e) {
        return null
      }
    },
  },
})

function isGraphPointer (pointer: any): pointer is GraphPointer {
  return 'term' in pointer
}

function isLiteral (ptr: GraphPointer): ptr is GraphPointer<Literal> {
  return ptr.term.termType === 'Literal'
}

function getLabels (pointer: GraphPointer | null): MultiPointer<Literal> | undefined {
  return pointer?.out(schema.name).filter(isLiteral)
}
</script>
