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
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import $rdf from '@rdfjs/data-model'
import { Term } from 'rdf-js'
import TermSet from '@rdf-esm/term-set'
import { GraphPointer } from 'clownface'
import { Dataset, Project } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import CubePreviewValue from '@/components/CubePreviewValue.vue'
import { api } from '@/api'
import RdfResource from '@tpluscode/rdfine/RdfResource'

const projectNS = namespace('project')

@Component({
  components: { CubePreviewValue, LoadingBlock, SidePane, TermDisplay },
})
export default class ResourcePreview extends Vue {
  @projectNS.State('project') project!: Project | null
  @projectNS.State('cubeMetadata') cubeMetadata!: Dataset | null
  @projectNS.State('selectedLanguage') selectedLanguage!: string

  get cubeUri (): string | undefined {
    return this.cubeMetadata?.hasPart[0]?.id.value
  }

  resourceId = $rdf.namedNode(this.$route.params.resourceId)
  resource: GraphPointer | null = null
  properties: [Term, (Term | RdfResource)[]][] = []

  async mounted (): Promise<void> {
    const cubeGraph = this.project?.cubeGraph
    if (!cubeGraph) throw new Error('Project does not have a cubeGraph')

    const url = new URL(cubeGraph.value)
    url.searchParams.append('resource', this.resourceId.value)
    const responseResource = await api.fetchResource(url.href)

    const resource = responseResource.pointer.namedNode(this.resourceId)
    const resourceQuads = [...responseResource.pointer.dataset.match(this.resourceId, null, null, $rdf.namedNode(url.href))]
    const resourcePredicates = new TermSet(resourceQuads.map(({ predicate }) => predicate))

    this.resource = resource
    this.properties = [...resourcePredicates].map((predicate) => {
      const values = resource.out(predicate).map((pointer: GraphPointer) => {
        if (pointer.term.termType === 'NamedNode') {
          return RdfResource.factory.createEntity(pointer)
        } else {
          return pointer.term
        }
      })

      return [predicate, values]
    })
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeDesigner' })
  }
}
</script>
