<template>
  <div class="table-container cube-preview">
    <table class="table is-condensed is-bordered">
      <thead>
        <tr>
          <th :colspan="dimensions.length || 1">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  <term-with-language :values="cubeMetadata.title" :selected-language="selectedLanguage">
                    Missing cube title
                  </term-with-language>
                </div>
                <div class="level-item">
                  <hydra-operation-button :operation="cubeMetadata.actions.edit" :to="{ name: 'CubeMetadataEdit' }" />
                </div>
              </div>
              <div class="level-right">
                <b-select v-model="selectedLanguage" class="level-item" title="Language">
                  <option v-for="language in languages" :key="language" :value="language">
                    {{ language }}
                  </option>
                </b-select>
              </div>
            </div>
          </th>
        </tr>
        <tr>
          <th v-for="dimension in dimensions" :key="dimension.id.value">
            <cube-preview-dimension :dimension="dimension" :selected-language="selectedLanguage" />
          </th>
          <th v-if="dimensions.length === 0" class="has-text-grey has-text-centered">
            No dimensions defined
          </th>
        </tr>
      </thead>
      <tbody class="is-family-monospace">
        <tr v-if="observations.isLoading">
          <td :colspan="tableWidth">
            <loading-block />
          </td>
        </tr>
        <tr v-else-if="observations.error">
          <td :colspan="tableWidth">
            <b-message type="is-danger">
              {{ observations.error }}
            </b-message>
          </td>
        </tr>
        <tr v-else-if="observations.data.length === 0">
          <td :colspan="tableWidth">
            <p class="has-text-grey has-text-centered">
              No observations available. Did you already run a transformation?
            </p>
          </td>
        </tr>
        <tr v-else v-for="observation in observations.data" :key="observation.id.value">
          <td v-for="dimension in dimensions" :key="dimension.clientPath" :class="dimensionClasses(dimension)">
            <cube-preview-value :value="observation[dimension.about.value]" :selected-language="selectedLanguage" :cube-uri="cube.id.value" />
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td :colspan="tableWidth">
            <div class="is-flex">
              <b-tooltip class="mr-2" label="Refresh data">
                <b-button icon-left="sync" @click="fetchCubeData" />
              </b-tooltip>
              <b-select v-model="pageSize" title="Page size">
                <option v-for="pageSizeOption in pageSizes" :key="pageSizeOption" :native-value="pageSizeOption">
                  {{ pageSizeOption }}
                </option>
              </b-select>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import clownface from 'clownface'
import { Collection } from 'alcaeus'
import { hydra } from '@tpluscode/rdf-ns-builders'
import * as $rdf from '@rdf-esm/dataset'
import type { Cube, Dataset, DimensionMetadata } from '@cube-creator/model'
import { scale } from '@cube-creator/core/namespace'
import { api } from '@/api'
import Remote, { RemoteData } from '@/remote'
import HydraOperationButton from './HydraOperationButton.vue'
import TermWithLanguage from './TermWithLanguage.vue'
import LoadingBlock from './LoadingBlock.vue'
import CubePreviewDimension from './CubePreviewDimension.vue'
import CubePreviewValue from './CubePreviewValue.vue'

const languages = ['en', 'fr', 'de', 'it']

@Component({
  components: {
    CubePreviewDimension,
    CubePreviewValue,
    HydraOperationButton,
    LoadingBlock,
    TermWithLanguage,
  },
})
export default class extends Vue {
  @Prop() cubeMetadata!: Dataset
  @Prop() dimensions!: DimensionMetadata[]

  languages = languages
  selectedLanguage = 'en'
  pageSize = 10
  pageSizes = [10, 20, 50, 100]
  observations: RemoteData<any[]> = Remote.loading()

  get cube (): Cube | null {
    return this.cubeMetadata.hasPart[0] ?? null
  }

  get tableWidth (): number {
    return this.dimensions.length || 1
  }

  mounted (): void {
    this.fetchCubeData()
  }

  dimensionClasses (dimension: DimensionMetadata): string {
    const scaleOfMeasure = dimension.scaleOfMeasure

    if (
      scale.Numerical.equals(scaleOfMeasure) ||
      scale.Continuous.equals(scaleOfMeasure) ||
      scale.Discrete.equals(scaleOfMeasure) ||
      scale.Temporal.equals(scaleOfMeasure)
    ) {
      return 'has-text-right'
    }

    return ''
  }

  @Watch('pageSize')
  async fetchCubeData (): Promise<void> {
    this.observations = Remote.loading()

    if (!this.cube) {
      this.observations = Remote.error('No available cube')
      return
    }

    if (!this.cube.observations) {
      // Fake wait to make it clear that something is happening
      await sleep(200)
      this.observations = Remote.loaded([])
      return
    }

    const filters = clownface({ dataset: $rdf.dataset() })
      .blankNode()
      .addOut(hydra.limit, this.pageSize)

    const uri = this.cube.observations.expand(filters)

    try {
      const collection = await api.fetchResource<Collection>(uri)
      this.observations = Remote.loaded(collection.member)
    } catch (e) {
      this.observations = Remote.error(e.toString())
    }
  }
}

async function sleep (duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration))
}
</script>

<style scoped>
.cube-preview {
  min-width: 40rem;
}
</style>
