<template>
  <side-pane title="Resource preview" @close="onCancel">
    <h3 class="is-title is-size-6 mb-4">
      <term-display :term="resourceId" :base="cubeUri" class="tag is-rounded has-text-weight-bold" />
    </h3>
    <table v-if="resource" class="table is-fullwidth">
      <tr v-for="([predicate, objects], index) in properties" :key="index">
        <td class="has-text-weight-semibold">
          <term-display :term="predicate" :base="cubeUri" />
        </td>
        <td>
          <p v-for="(object, objectIndex) in objects" :key="objectIndex">
            <cube-preview-value
              :value="object"
              :cube-uri="cubeUri"
              :selected-language="selectedLanguage"
              :show-language="true"
            />
          </p>
        </td>
      </tr>
    </table>
    <loading-block v-else />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import $rdf from '@rdfjs/data-model'
import { NamedNode, Term } from 'rdf-js'
import TermSet from '@rdf-esm/term-set'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { GraphPointer } from 'clownface'
import SidePane from '@/components/SidePane.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import CubePreviewValue from '@/components/CubePreviewValue.vue'
import { api } from '@/api'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'ResourcePreview',
  components: { CubePreviewValue, LoadingBlock, SidePane, TermDisplay },

  data (): { resourceId: NamedNode, resource: GraphPointer | null, properties: [Term, (Term | RdfResource)[]][] } {
    return {
      resourceId: $rdf.namedNode(this.$route.params.resourceId),
      resource: null,
      properties: [],
    }
  },

  async mounted (): Promise<void> {
    const cubeGraph = this.project?.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const url = new URL(cubeGraph.value)
    url.searchParams.append('resource', this.resourceId.value)
    url.searchParams.append('sharedTerm', this.$route.params.sharedTerm)
    const responseResource = await api.fetchResource(url.href)

    const resource = responseResource.pointer.namedNode(this.resourceId)
    const resourceQuads = [...responseResource.pointer.dataset.match(this.resourceId, null, null, $rdf.namedNode(url.href))]
    const resourcePredicates = new TermSet(resourceQuads.map(({ predicate }) => predicate))

    this.resource = resource
    this.properties = [...resourcePredicates].map((predicate) => {
      const values: (Term | RdfResource)[] = resource.out(predicate).map((pointer: GraphPointer) => {
        if (pointer.term.termType === 'NamedNode') {
          return RdfResource.factory.createEntity(pointer)
        } else {
          return pointer.term
        }
      })

      return [predicate, values]
    })
  },

  computed: {
    ...mapState('project', {
      project: 'project',
      cubeMetadata: 'cubeMetadata',
      selectedLanguage: 'selectedLanguage',
    }),

    cubeUri (): string | undefined {
      return this.cubeMetadata?.hasPart[0]?.id.value
    },
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'CubeDesigner' })
    },
  },
})
</script>
