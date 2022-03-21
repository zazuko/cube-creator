<template>
  <div ref="root" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs, watch } from 'vue'
import type { TemplateResult } from 'lit'
import { render } from 'lit'
import { nextTick } from 'process'

export default defineComponent({
  name: 'RenderWcTemplate',
  props: {
    templateResult: {
      type: Object as PropType<TemplateResult>,
      required: true,
    },
  },

  setup (props) {
    const { templateResult } = toRefs(props)
    const root = ref()

    const renderTemplate = () => {
      nextTick(() => {
        render(templateResult.value, root.value)
      })
    }
    watch(templateResult, renderTemplate, { immediate: true })

    return {
      root,
    }
  },
})
</script>
