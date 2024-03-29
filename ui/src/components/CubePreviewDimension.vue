<template>
  <div class="dimension">
    <div class="dimension-header">
      <term-with-language :values="dimension.name" :selected-language="selectedLanguage">
        <span class="has-text-danger">
          Missing name for <em><term-display :term="dimension.about" :base="cubeUri" /></em>
        </span>
      </term-with-language>
      <hydra-operation-button
        :operation="dimension.actions.edit"
        :to="{ name: 'DimensionEdit', params: { dimensionId: dimension.clientPath } }"
      />
      <div v-if="dimension.mappings">
        <o-tooltip :label="linkToSharedDimensionLabel">
          <o-button
            tag="router-link"
            :to="{ name: 'DimensionMapping', params: { dimensionId: dimension.clientPath } }"
            icon-left="link"
            size="small"
            variant="text"
            :class="{ 'has-text-primary': dimension.sharedDimensions.length > 0 }"
          />
        </o-tooltip>
      </div>
    </div>
    <div class="icons">
      <scale-of-measure-icon :scale-of-measure="dimension.scaleOfMeasure" />
      <data-kind-icon :data-kind="dimension.dataKind" />
      <o-tooltip v-show="description" :label="description">
        <o-icon icon="comment-alt" pack="far" variant="primary" />
      </o-tooltip>
      <o-tooltip v-if="dimension.hierarchies.length" class="tag is-rounded is-primary">
        <o-icon icon="sitemap" />
        <template #content>
          Hierarchies:
          <ul v-for="hierarchy of dimension.hierarchies" :key="hierarchy.id.value">
            <li>{{ hierarchy.name }}</li>
          </ul>
        </template>
      </o-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { DimensionMetadata } from '@cube-creator/model'
import { defineComponent, PropType } from 'vue'
import type { Literal } from '@rdfjs/types'
import HydraOperationButton from './HydraOperationButton.vue'
import DataKindIcon from './DataKindIcon.vue'
import ScaleOfMeasureIcon from './ScaleOfMeasureIcon.vue'
import TermDisplay from './TermDisplay.vue'
import TermWithLanguage from './TermWithLanguage.vue'

export default defineComponent({
  name: 'CubePreviewDimension',
  components: {
    DataKindIcon,
    HydraOperationButton,
    ScaleOfMeasureIcon,
    TermDisplay,
    TermWithLanguage,
  },
  props: {
    dimension: {
      type: Object as PropType<DimensionMetadata>,
      required: true,
    },
    selectedLanguage: {
      type: String,
      required: true,
    },
    cubeUri: {
      type: String,
      required: true,
    },
  },

  computed: {
    description (): string {
      const description = this.dimension.description.find(({ language }) => language === this.selectedLanguage)

      return description?.value ?? ''
    },

    linkToSharedDimensionLabel (): string {
      const dimension: any = this.dimension

      if (dimension.sharedDimensions.length > 0) {
        const label = dimension.sharedDimensions.map(({ label }: { label: Literal }) => `"${label.value}"`).join(' & ')
        return `Linked to ${label} (click to edit)`
      } else if (dimension.mappings) {
        return 'Link to shared dimension'
      } else {
        return ''
      }
    },
  },
})
</script>

<style scoped>
.dimension-header {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
