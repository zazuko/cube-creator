<template>
  <o-input :model-value="value" @update:modelValue="update" :readonly="readonly" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'TextFieldEditor',
  props: {
    value: {
      type: String,
      default: undefined,
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    update: {
      type: Function as PropType<(newValue: string) => void>,
      required: true,
    },
  },
})
</script>
