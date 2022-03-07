<template>
  <o-input :value="value" @input="update" />
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'

export default defineComponent({
  name: 'TextFieldEditor',
  props: {
    value: {
      type: String,
      default: undefined,
    },
    update: {
      type: Function as PropType<(newValue: string) => void>,
      required: true,
    },
  },
})
</script>
