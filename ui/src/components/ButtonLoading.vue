<template>
  <o-button
    :native-type="nativeType"
    :variant="variant"
    :size="size"
    :icon-left="icon"
    :icon-class="iconClass"
    :disabled="disabled || loading"
    v-on="$listeners"
  >
    <slot />
  </o-button>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'ButtonLoading',
  props: {
    nativeType: {
      type: String,
      default: undefined,
    },
    variant: {
      type: String,
      default: undefined,
    },
    size: {
      type: String,
      default: undefined,
    },
    iconLeft: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    icon (): string | undefined {
      if (this.loading) {
        return 'spinner'
      } else {
        return this.iconLeft
      }
    },

    iconClass (): string {
      return this.loading
        ? 'animate-spin'
        : ''
    },
  }
})
</script>
