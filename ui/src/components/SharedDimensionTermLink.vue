<template>
  <o-tooltip :label="uri">
    <a :href="uri" target="_blank" rel="noopener noreferer" class="button is-small is-text">
      <b-icon icon="external-link-alt" />
    </a>
  </o-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { SharedDimensionTerm } from '../store/types'

@Component
export default class extends Vue {
  @Prop({ required: true }) term!: SharedDimensionTerm

  get uri (): string {
    return this.term.canonical?.value || this.term.id?.value
  }
}
</script>
