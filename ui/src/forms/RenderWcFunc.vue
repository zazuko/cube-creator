<template>
  <div />
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { render } from 'lit-html'

@Component
export default class RenderWc extends Vue {
  @Prop() f!: (...args: unknown[]) => unknown
  @Prop() args!: unknown[]

  mounted (): void {
    this.renderComponent()
  }

  @Watch('args')
  onArgsChange (): void {
    this.renderComponent()
  }

  renderComponent (): void {
    render(this.f(...this.args), this.$el)
  }
}
</script>
