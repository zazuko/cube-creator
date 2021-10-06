<template>
  <div v-if="cubeMetadata && dimensionMetadataCollection">
    <CubePreview
      :cube-metadata="cubeMetadata"
      :dimensions="dimensions"
      :selected-language="selectedLanguage"
      @selectLanguage="selectLanguage"
      @refreshDimensions="refreshDimensions"
    />

    <router-view :key="$route.fullPath" />
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { Dataset, DimensionMetadata, DimensionMetadataCollection } from '@cube-creator/model'
import CubePreview from '@/components/CubePreview.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { CubePreview, LoadingBlock },
})
export default class CubeDesignerView extends Vue {
  @storeNs.project.State('cubeMetadata') cubeMetadata!: Dataset | null
  @storeNs.project.State('selectedLanguage') selectedLanguage!: string
  @storeNs.project.State('dimensionMetadataCollection') dimensionMetadataCollection!: DimensionMetadataCollection | null
  @storeNs.project.Getter('dimensions') dimensions!: DimensionMetadata[]

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCubeMetadata')
    this.$store.dispatch('project/fetchDimensionMetadataCollection')
  }

  selectLanguage (language: string): void {
    this.$store.dispatch('project/selectLanguage', language)
  }

  refreshDimensions (): void {
    this.$store.dispatch('project/fetchDimensionMetadataCollection')
  }
}
</script>
