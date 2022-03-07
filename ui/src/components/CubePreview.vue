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
                <o-select :value="selectedLanguage" @input="$emit('selectLanguage', $event)" class="level-item" title="Language">
                  <option v-for="language in languages" :key="language" :value="language">
                    {{ language }}
                  </option>
                </o-select>
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
        <tr v-for="error in errors" :key="error.id.value">
          <td :colspan="tableWidth" class="p-0">
            <div class="message is-warning">
              <p class="message-body px-2 py-1 is-flex">
                <o-icon icon="exclamation-triangle" class="mr-1" />
                <span>{{ error.description }}</span>
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
        <tr v-else-if="observations.data && observations.data.length === 0">
          <td :colspan="tableWidth">
            <p class="has-text-grey has-text-centered">
              No observations available. Did you already run a transformation?
            </p>
          </td>
        </tr>
        <tr v-else v-for="observation in observations.data" :key="observation.id.value">
          <td v-for="dimension in dimensions" :key="dimension.clientPath" :class="dimensionClasses(dimension)">
            <cube-preview-value
              :value="observation[dimension.about.value]"
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
            <div class="is-flex is-justify-content-space-between gap-4">
              <div class="is-flex is-align-items-center gap-1">
                <o-tooltip label="Previous page">
                  <o-button
                    icon-left="chevron-left"
                    @click="page = page - 1"
                    :disabled="!hasPreviousPage"
                  />
                </o-tooltip>
                <o-tooltip label="Next page">
                  <o-button
                    icon-left="chevron-right"
                    @click="page = page + 1"
                    :disabled="!hasNextPage"
                  />
                </o-tooltip>
                <span class="ml-4">Page</span>
                <o-input
                  v-model.number="page"
                  type="number"
                  min="1"
                  :max="totalPages"
                  class="is-inline-block w-20"
                />
                <span class="">of {{ totalPages }}</span>
                <span class="ml-4">
                  ({{ totalItems }} observations)
                </span>
              </div>
              <div class="is-flex gap-2">
                <o-tooltip label="Page size">
                  <o-select v-model="pageSize" title="Page size">
                    <option v-for="pageSizeOption in pageSizes" :key="pageSizeOption" :native-value="pageSizeOption">
                      {{ pageSizeOption }}
                    </option>
                  </o-select>
                </o-tooltip>
                <o-tooltip label="Refresh data">
                  <o-button icon-left="sync" @click="refreshData" />
                </o-tooltip>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import clownface from 'clownface'
import { Collection } from 'alcaeus'
import { hydra, qudt } from '@tpluscode/rdf-ns-builders'
import * as Schema from '@rdfine/schema'
import * as $rdf from '@rdf-esm/dataset'
import { debounce } from 'debounce'
import type { Cube, Dataset, DimensionMetadata, DimensionMetadataCollection } from '@cube-creator/model'
import { supportedLanguages } from '@cube-creator/core/languages'
import { api } from '@/api'
import Remote, { RemoteData } from '@/remote'
import BMessage from './BMessage.vue'
import HydraOperationButton from './HydraOperationButton.vue'
import TermWithLanguage from './TermWithLanguage.vue'
import LoadingBlock from './LoadingBlock.vue'
import CubePreviewDimension from './CubePreviewDimension.vue'
import CubePreviewValue from './CubePreviewValue.vue'

const debounceRefreshDelay = 500

export default defineComponent({
  name: 'CubePreview',
  components: {
    BMessage,
    CubePreviewDimension,
    CubePreviewValue,
    HydraOperationButton,
    LoadingBlock,
    TermWithLanguage,
  },
  props: {
    cubeMetadata: {
      type: Object as PropType<Dataset>,
      required: true,
    },
    dimensions: {
      type: Array as PropType<DimensionMetadata[]>,
      required: true,
    },
    dimensionMetadataCollection: {
      type: Object as PropType<DimensionMetadataCollection>,
      required: true,
    },
    selectedLanguage: {
      type: String,
      required: true,
    },
  },

  data (): {
    languages: string[],
    pageSize: number,
    page: number,
    pageSizes: number[],
    observations: RemoteData<unknown[]>,
    totalItems: number | null,
    debouncedFetchCubeData: () => Promise<void>,
    } {
    return {
      languages: supportedLanguages.map(({ value }) => value),
      pageSize: 10,
      page: 1,
      pageSizes: [10, 20, 50, 100],
      observations: Remote.loading(),
      totalItems: null,
      debouncedFetchCubeData: () => new Promise(resolve => resolve()),
    }
  },

  created (): void {
    this.debouncedFetchCubeData = debounce(this.fetchCubeData.bind(this), debounceRefreshDelay)
  },

  mounted (): void {
    this.fetchCubeData()
  },

  computed: {
    cube (): Cube | null {
      return this.cubeMetadata.hasPart[0] ?? null
    },

    tableWidth (): number {
      return this.dimensions.length || 1
    },

    errors (): Schema.Thing[] {
      return [
        ...(this.cubeMetadata.errors ?? []),
        ...(this.dimensionMetadataCollection.errors ?? []),
      ]
    },

    totalPages (): number | null {
      if (!this.totalItems) return null

      return Math.ceil(this.totalItems / this.pageSize)
    },

    hasPreviousPage (): boolean {
      return this.page > 1
    },

    hasNextPage (): boolean {
      return this.page < (this.totalPages ?? 0)
    },
  },

  methods: {
    dimensionClasses (dimension: DimensionMetadata): string {
      const scaleOfMeasure = dimension.scaleOfMeasure

      if (
        qudt.RatioScale.equals(scaleOfMeasure) ||
        qudt.IntervalScale.equals(scaleOfMeasure)
      ) {
        return 'has-text-right'
      }

      return ''
    },

    async refreshData (): Promise<void> {
      if (this.dimensions.length === 0) {
        this.$emit('refreshDimensions')
      }

      return this.fetchCubeData()
    },

    async fetchCubeData (): Promise<void> {
      if (this.page <= 0) {
        return
      }

      this.observations = Remote.loading()

      if (!this.cube) {
        this.observations = Remote.error('No available cube')
        return
      }

      if (!this.cube.observations) {
        // Fake wait to make it clear that something is happening
        await sleep(200)
        this.observations = Remote.loaded([])
        this.totalItems = 0
        return
      }

      const filters = clownface({ dataset: $rdf.dataset() })
        .blankNode()
        .addOut(hydra.limit, this.pageSize)
        .addOut(hydra.pageIndex, this.page)

      const uri = this.cube.observations.expand(filters)

      try {
        const collection = await api.fetchResource<Collection>(uri)
        this.totalItems = collection.totalItems ?? 0
        this.observations = Remote.loaded(collection.member)
      } catch (e) {
        this.observations = Remote.error(e.toString())
      }
    },
  },

  watch: {
    pageSize () {
      this.page = 1
      this.debouncedFetchCubeData()
    },

    page () {
      this.debouncedFetchCubeData()
    },
  },
})

async function sleep (duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration))
}
</script>

<style scoped>
.cube-preview {
  min-width: 40rem;
}
</style>
