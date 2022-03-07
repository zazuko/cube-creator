<template>
  <o-radio
    :value="value"
    :native-value="nativeValue"
    :size="size"
    @input="$emit('input', $event)"
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
    value: {
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

  computed: {
    isSelected (): boolean {
      return this.value === this.nativeValue
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
