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
import { defineComponent, ref, Ref } from 'vue'
import { mapState } from 'vuex'
import { useRoute } from 'vue-router'
import $rdf from '@rdf-esm/data-model'
import type { NamedNode, Term } from '@rdfjs/types'
import TermSet from '@rdf-esm/term-set'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { GraphPointer } from 'clownface'
import SidePane from '@/components/SidePane.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import CubePreviewValue from '@/components/CubePreviewValue.vue'
import { api } from '@/api'

export default defineComponent({
  name: 'ResourcePreview',
  components: { CubePreviewValue, LoadingBlock, SidePane, TermDisplay },

  setup () {
    const route = useRoute()
    const resourceIdParam = route.params.resourceId as string
    const resourceId: Ref<NamedNode> = ref($rdf.namedNode(resourceIdParam))
    const resource: Ref<GraphPointer | null> = ref(null)
    const properties: Ref<[Term, (Term | RdfResource)[]][]> = ref([])

    return {
      resourceId,
      resource,
      properties,
    }
  },

  async mounted (): Promise<void> {
    const cubeGraph = this.project?.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const url = new URL(cubeGraph.value)
    url.searchParams.append('resource', this.resourceId.value)
    url.searchParams.append('sharedTerm', this.$route.params.sharedTerm as string)
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
