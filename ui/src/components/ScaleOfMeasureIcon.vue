<template>
  <o-tooltip v-if="scaleOfMeasure" :label="label" class="tag is-rounded is-primary">
    <o-icon :icon="icon" />
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Term } from 'rdf-js'
import { qudt } from '@tpluscode/rdf-ns-builders'

const icons: Record<string, string> = {
  [qudt.NominalScale.value]: 'th-large',
  [qudt.OrdinalScale.value]: 'list-ul',
  [qudt.IntervalScale.value]: 'chart-line',
  [qudt.RatioScale.value]: 'balance-scale-right',
}

export default defineComponent({
  name: 'ScaleOfMeasureIcon',
  props: {
    scaleOfMeasure: {
      type: Object as PropType<Term>,
      default: undefined,
    },
  },

  computed: {
    label (): string {
      return this.scaleOfMeasure?.value.split('/').slice(-1)[0] ?? ''
    },

    icon (): string {
      const scaleOfMeasure = this.scaleOfMeasure?.value ?? ''

      return icons[scaleOfMeasure] || 'question-circle'
    },
  },
})
</script>
