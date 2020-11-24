<template>
  <table class="table is-condensed is-bordered cube-preview">
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
              <b-tooltip class="level-item" label="Refresh data">
                <b-button icon-left="sync" @click="fetchCubeData" />
              </b-tooltip>
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
          <term-with-language :values="dimension.name" :selected-language="selectedLanguage">
            Missing dimension name
          </term-with-language>
          <hydra-operation-button
            :operation="dimension.actions.edit"
            :to="{ name: 'DimensionEdit', params: { dimensionId: dimension.clientPath } }"
          />
        </th>
        <th v-if="dimensions.length === 0" class="has-text-grey has-text-centered">
          No dimensions defined
        </th>
      </tr>
    </thead>
    <tbody>
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
            No observations available
          </p>
        </td>
      </tr>
      <tr v-else v-for="observation in observations.data" :key="observation.id.value">
        <td v-for="dimension in dimensions" :key="dimension.clientPath">
          <term-display :term="observation[dimension.about.value]" />
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td :colspan="tableWidth" class="has-text-right">
          <b-select v-model="pageSize" title="Page size">
            <option v-for="pageSizeOption in pageSizes" :key="pageSizeOption" :native-value="pageSizeOption">
              {{ pageSizeOption }}
            </option>
          </b-select>
        </td>
      </tr>
    </tfoot>
  </table>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import clownface from 'clownface'
import { Collection } from 'alcaeus'
import { hydra } from '@tpluscode/rdf-ns-builders'
import * as $rdf from '@rdf-esm/dataset'
import type { Cube, Dataset, DimensionMetadata } from '@cube-creator/model'
import { api } from '@/api'
import Remote, { RemoteData } from '@/remote'
import HydraOperationButton from './HydraOperationButton.vue'
import TermWithLanguage from './TermWithLanguage.vue'
import LoadingBlock from './LoadingBlock.vue'
import TermDisplay from './TermDisplay.vue'

const languages = ['en', 'fr', 'de', 'it']

@Component({
  components: { HydraOperationButton, LoadingBlock, TermDisplay, TermWithLanguage },
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

  @Watch('pageSize')
  async fetchCubeData (): Promise<void> {
    this.observations = Remote.loading()

    if (!this.cube) {
      this.observations = Remote.error('No available cube')
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
</script>

<style scoped>
.cube-preview {
  min-width: 40rem;
}
</style>
