<template>
  <o-tooltip v-if="dataKind" :label="label" class="tag is-rounded is-primary">
    <o-icon :icon="icon" />
  </o-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
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

@Component
export default class extends Vue {
  @Prop() dataKind?: Term

  get dataKindURI (): string {
    return this.dataKind?.value ?? ''
  }

  get label (): string {
    return labels[this.dataKindURI] || this.dataKindURI
  }

  get icon (): string {
    return icons[this.dataKindURI] || 'question-circle'
  }
}
</script>
