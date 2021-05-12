<template>
  <div class="table-container cube-preview">
    <table class="table is-condensed is-bordered is-striped">
      <thead>
        <tr>
          <th :colspan="dimensions.length || 1">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  <term-with-language :values="cubeMetadata.title" :selected-language="selectedLanguage">
                    <span class="has-text-danger">Missing cube title</span>
                  </term-with-language>
                </div>
                <div class="level-item">
                  <hydra-operation-button :operation="cubeMetadata.actions.edit" :to="{ name: 'CubeMetadataEdit' }" />
                </div>
              </div>
              <div class="level-right">
                <b-select :value="selectedLanguage" @input="$emit('selectLanguage', $event)" class="level-item" title="Language">
                  <option v-for="language in languages" :key="language" :value="language">
                    {{ language }}
                  </option>
                </b-select>
              </div>
            </div>
          </th>
        </tr>
        <tr class="has-background-light">
          <th
            v-for="dimension in dimensions"
            :key="dimension.id.value"
            :class="{
              'has-background-primary-light': dimension.isMeasureDimension,
              'has-text-weight-normal': !(dimension.isMeasureDimension || dimension.isKeyDimension),
            }"
          >
            <cube-preview-dimension :dimension="dimension" :selected-language="selectedLanguage" :cube-uri="cube.id.value" />
          </th>
          <th v-if="dimensions.length === 0" class="has-text-grey has-text-centered">
            No dimensions defined
          </th>
        </tr>
        <tr v-if="warningMessage">
          <td :colspan="tableWidth" class="p-0">
            <div class="message is-warning">
              <p class="message-body px-2 py-1 is-flex">
                <b-icon icon="exclamation-triangle" class="mr-1" />
                <span>{{ warningMessage }}</span>
              </p>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-if="observations.isLoading">
          <td :colspan="tableWidth" class="p-0">
            <loading-block class="has-background-light is-size-2" :style="`height: calc(38px * ${this.pageSize});`" />
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
            <cube-preview-value :value="observation[dimension.about.value]"
                                :is-shared-term="!!dimension.sharedDimension"
                                :selected-language="selectedLanguage"
                                :cube-uri="cube.id.value"
            />
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td :colspan="tableWidth" class="has-background-light">
            <div class="is-flex gap-4">
              <div class="is-flex is-align-items-center gap-1">
                <span class="pr-1">Page {{ page }}</span>
                <b-tooltip label="Previous page">
                  <b-button
                    icon-left="chevron-left"
                    @click="page = page - 1"
                    :disabled="!observations.data || page === 1"
                  />
                </b-tooltip>
                <b-tooltip label="Next page">
                  <b-button
                    icon-left="chevron-right"
                    @click="page = page + 1"
                    :disabled="!observations.data || observations.data.length === 0"
                  />
                </b-tooltip>
              </div>
              <b-tooltip label="Page size">
                <b-select v-model="pageSize" title="Page size">
                  <option v-for="pageSizeOption in pageSizes" :key="pageSizeOption" :native-value="pageSizeOption">
                    {{ pageSizeOption }}
                  </option>
                </b-select>
              </b-tooltip>
              <b-tooltip label="Refresh data">
                <b-button icon-left="sync" @click="fetchCubeData" />
              </b-tooltip>
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
import { hydra, qudt } from '@tpluscode/rdf-ns-builders'
import * as $rdf from '@rdf-esm/dataset'
import type { Cube, Dataset, DimensionMetadata } from '@cube-creator/model'
import { supportedLanguages } from '@cube-creator/core/languages'
import { api } from '@/api'
import Remote, { RemoteData } from '@/remote'
import HydraOperationButton from './HydraOperationButton.vue'
import TermWithLanguage from './TermWithLanguage.vue'
import LoadingBlock from './LoadingBlock.vue'
import CubePreviewDimension from './CubePreviewDimension.vue'
import CubePreviewValue from './CubePreviewValue.vue'

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
  @Prop({ required: true }) cubeMetadata!: Dataset
  @Prop({ required: true }) dimensions!: DimensionMetadata[]
  @Prop({ required: true }) selectedLanguage!: string

  languages = supportedLanguages.map(({ value }) => value)
  pageSize = 10
  page = 1
  pageSizes = [10, 20, 50, 100]
  observations: RemoteData<unknown[]> = Remote.loading()

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
      qudt.RatioScale.equals(scaleOfMeasure) ||
      qudt.IntervalScale.equals(scaleOfMeasure)
    ) {
      return 'has-text-right'
    }

    return ''
  }

  get warningMessage (): string | null {
    if (this.dimensions.length > 0 && !this.dimensions.some(({ isMeasureDimension }) => isMeasureDimension)) {
      return 'No Measure dimension defined'
    }

    return null
  }

  @Watch('pageSize')
  resetPage (): void {
    this.page = 1
  }

  @Watch('pageSize')
  @Watch('page')
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
      .addOut(hydra.pageIndex, this.page)

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
