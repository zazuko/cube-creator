<template>
  <o-input :value="value" readonly />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

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
