<template>
  <div v-if="cubeMetadata && dimensionMetadataCollection">
    <CubePreview
      :cube-metadata="cubeMetadata"
      :dimensions="dimensions"
      :selected-language="selectedLanguage"
      @selectLanguage="selectLanguage"
    />

    <router-view :key="$route.fullPath" />
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type { Dataset, DimensionMetadata, DimensionMetadataCollection } from '@cube-creator/model'
import CubePreview from '@/components/CubePreview.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'

const projectNS = namespace('project')

@Component({
  components: { CubePreview, LoadingBlock },
})
export default class CubeDesignerView extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: Dataset | null
  @projectNS.State('selectedLanguage') selectedLanguage!: string
  @projectNS.State('dimensionMetadataCollection') dimensionMetadataCollection!: DimensionMetadataCollection | null
  @projectNS.Getter('dimensions') dimensions!: DimensionMetadata[]

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCubeMetadata')
    this.$store.dispatch('project/fetchDimensionMetadataCollection')
  }

  selectLanguage (language: string): void {
    this.$store.dispatch('project/selectLanguage', language)
  }
}
</script>
