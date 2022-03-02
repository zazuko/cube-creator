<template>
  <div v-if="cubeMetadata && dimensionMetadataCollection">
    <cube-preview
      :cube-metadata="cubeMetadata"
      :dimensions="dimensions"
      :dimension-metadata-collection="dimensionMetadataCollection"
      :selected-language="selectedLanguage"
      @selectLanguage="selectLanguage"
      @refreshDimensions="refreshDimensions"
    />

    <router-view :key="$route.fullPath" />
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import CubePreview from '@/components/CubePreview.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'CubeDesignerView',
  components: { CubePreview, LoadingBlock },

  computed: {
    ...mapState('project', [
      'cubeMetadata',
      'selectedLanguage',
      'dimensionMetadataCollection',
    ]),
    ...mapGetters('project', {
      dimensions: 'dimensions',
    }),
  },

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCubeMetadata')
    this.$store.dispatch('project/fetchDimensionMetadataCollection')
  },

  methods: {
    selectLanguage (language: string): void {
      this.$store.dispatch('project/selectLanguage', language)
    },

    refreshDimensions (): void {
      this.$store.dispatch('project/refreshDimensionMetadataCollection')
    },
  },
})
</script>
