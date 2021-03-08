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
        <b-tooltip label="Link to shared dimension">
          <b-button
            tag="router-link"
            :to="{ name: 'DimensionMapping', params: { dimensionId: dimension.clientPath } }"
            icon-left="link"
            size="is-small"
            type="is-text"
          />
        </b-tooltip>
      </div>
    </div>
    <div class="icons">
      <scale-of-measure-icon :scale-of-measure="dimension.scaleOfMeasure" />
      <data-kind-icon :data-kind="dimension.dataKind" />
      <b-tooltip v-show="description" :label="description">
        <b-icon icon="comment-alt" pack="far" type="is-primary" />
      </b-tooltip>
      <b-tooltip v-if="dimension.sharedDimension" :label="`Linked to ${dimension.sharedDimension.label}`">
        <b-icon icon="link" type="is-primary" />
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { DimensionMetadata } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'
import DataKindIcon from './DataKindIcon.vue'
import ScaleOfMeasureIcon from './ScaleOfMeasureIcon.vue'
import TermDisplay from './TermDisplay.vue'
import TermWithLanguage from './TermWithLanguage.vue'

@Component({
  components: { DataKindIcon, HydraOperationButton, ScaleOfMeasureIcon, TermDisplay, TermWithLanguage },
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
