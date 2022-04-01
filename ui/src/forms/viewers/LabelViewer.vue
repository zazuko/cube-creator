<template>
  <o-input :model-value="value" readonly />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LabelViewer',
  props: {
    value: {
      type: String,
      default: undefined,
    },
  },
})
</script>
