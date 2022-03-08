<template>
  <o-radio
    :model-value="modelValue"
    :native-value="nativeValue"
    :size="size"
    @update:modelValue="$emit('update:modelValue', $event)"
    class="button radio-button"
    :class="{ 'is-primary': isSelected }"
  >
    <slot />
  </o-radio>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'RadioButton',
  props: {
    modelValue: {
      type: String,
      default: undefined,
    },
    nativeValue: {
      type: String,
      default: undefined,
    },
    size: {
      type: String,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],

  computed: {
    isSelected (): boolean {
      return this.modelValue === this.nativeValue
    },
  }
})
</script>

<style>
.b-radio.radio-button .check,
.b-radio.radio-button input[type=radio] {
  display: none;
}

.b-radio.radio-button > .control-label {
  padding-left: 0 !important;
}
</style>
