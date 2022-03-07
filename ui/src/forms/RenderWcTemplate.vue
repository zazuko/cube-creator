<template>
  <div />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { TemplateResult } from 'lit'
import { render } from 'lit'

export default defineComponent({
  name: 'RenderWcTemplate',
  props: {
    templateResult: {
      type: Object as PropType<TemplateResult>,
      required: true,
    },
  },

  mounted (): void {
    this.renderTemplate()
  },

  watch: {
    templateResult (): void {
      this.renderTemplate()
    },
  },

  methods: {
    renderTemplate (): void {
      render(this.templateResult, this.$el as HTMLElement)
    },
  },
})
</script>
