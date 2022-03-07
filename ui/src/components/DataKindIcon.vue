<template>
  <o-tooltip v-if="dataKind" :label="label" class="tag is-rounded is-primary">
    <o-icon :icon="icon" />
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Term } from 'rdf-js'
import { schema, time } from '@tpluscode/rdf-ns-builders'

const labels: Record<string, string> = {
  [time.GeneralDateTimeDescription.value]: 'Time description',
  [schema.GeoCoordinates.value]: 'Geographic coordinates',
  [schema.GeoShape.value]: 'Geographic shape',
}

const icons: Record<string, string> = {
  [time.GeneralDateTimeDescription.value]: 'clock',
  [schema.GeoCoordinates.value]: 'map',
  [schema.GeoShape.value]: 'map-marked-alt',
}

export default defineComponent({
  name: 'DataKindIcon',
  props: {
    dataKind: {
      type: Object as PropType<Term>,
      default: undefined,
    }
  },

  computed: {
    dataKindURI (): string {
      return this.dataKind?.value ?? ''
    },

    label (): string {
      return labels[this.dataKindURI] || this.dataKindURI
    },

    icon (): string {
      return icons[this.dataKindURI] || 'question-circle'
    },
  },
})
</script>
