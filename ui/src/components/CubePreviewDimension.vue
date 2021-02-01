<template>
  <div class="dimension">
    <div class="dimension-header">
      <term-with-language :values="dimension.name" :selected-language="selectedLanguage">
        Missing name for <em><term-display :term="dimension.about" :base="cubeUri" /></em>
      </term-with-language>
      <hydra-operation-button
        :operation="dimension.actions.edit"
        :to="{ name: 'DimensionEdit', params: { dimensionId: dimension.clientPath } }"
      />
    </div>
    <div class="icons">
      <scale-of-measure-icon :scale-of-measure="dimension.scaleOfMeasure" />
      <b-tooltip v-show="description" :label="description">
        <b-icon icon="comment-alt" pack="far" type="is-primary" />
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DimensionMetadata } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'
import ScaleOfMeasureIcon from './ScaleOfMeasureIcon.vue'
import TermDisplay from './TermDisplay.vue'
import TermWithLanguage from './TermWithLanguage.vue'

@Component({
  components: { HydraOperationButton, ScaleOfMeasureIcon, TermDisplay, TermWithLanguage },
})
export default class CubePreviewDimension extends Vue {
  @Prop({ required: true }) dimension!: DimensionMetadata
  @Prop({ required: true }) selectedLanguage!: string
  @Prop({ required: true }) cubeUri!: string

  get description (): string {
    const description = this.dimension.description.find(({ language }) => language === this.selectedLanguage)

    return description?.value ?? ''
  }
}
</script>

<style scoped>
.dimension-header {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>
