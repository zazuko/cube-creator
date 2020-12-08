<template>
  <b-tooltip v-if="scaleOfMeasure" :label="label" class="tag is-rounded is-primary">
    <b-icon :icon="icon" />
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { scale } from '@cube-creator/core/namespace'

@Component
export default class extends Vue {
  @Prop() scaleOfMeasure?: Term

  get label (): string {
    return this.scaleOfMeasure?.value.split('/').slice(-1)[0] ?? ''
  }

  get icon (): string {
    const scaleOfMeasure = this.scaleOfMeasure?.value ?? ''

    return {
      [scale.Categorical.value]: 'list-ul',
      [scale.Continuous.value]: 'chart-line',
      [scale.Discrete.value]: 'chart-bar',
      [scale.Nominal.value]: 'list-ul',
      [scale.Ordinal.value]: 'list-ul',
      [scale.Numerical.value]: 'chart-line',
      [scale.Spatial.value]: 'globe-europe',
      [scale.Temporal.value]: 'clock',
    }[scaleOfMeasure] || 'question-circle'
  }
}
</script>
