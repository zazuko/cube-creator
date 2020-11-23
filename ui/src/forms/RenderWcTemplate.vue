<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import type { TemplateResult } from 'lit-element'
import { render } from 'lit-html'

@Component
export default class RenderWc extends Vue {
  @Prop() templateResult!: TemplateResult

  mounted (): void {
    this.renderTemplate()
  }

  @Watch('templateResult')
  onTemplateResultChange (): void {
    this.renderTemplate()
  }

  renderTemplate (): void {
    render(this.templateResult, this.$el)
  }
}
</script>
