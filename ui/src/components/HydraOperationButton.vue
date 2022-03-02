<template>
  <o-tooltip v-if="operation" :label="operation.title">
    <o-button
      :tag="tag"
      :to="to"
      @click="$emit('click')"
      :variant="variant"
      :size="size"
      :icon-left="iconName"
      :disabled="disabled"
    >
      <slot />
    </o-button>
  </o-tooltip>
</template>

<script lang="ts">
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { defineComponent, PropType } from '@vue/composition-api'
import { RuntimeOperation } from 'alcaeus'
import { Location } from 'vue-router'

export default defineComponent({
  name: 'HydraOperationButton',
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation | null>,
      default: null,
    },
    to: {
      type: Object as PropType<Location | null>,
      default: null,
    },
    variant: {
      type: String as PropType<ColorsModifiers>,
      default: 'text',
    },
    size: {
      type: String,
      default: 'small',
    },
    icon: {
      type: String,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    tag (): string {
      return this.to ? 'router-link' : 'button'
    },

    iconName (): string | null {
      return this.icon || guessIcon(this.operation)
    },
  },
})

function guessIcon (operation: RuntimeOperation | null): string | null {
  if (!operation) return null

  switch (operation.method) {
    case 'POST':
      return 'plus'
    case 'PATCH':
    case 'PUT':
      return 'pencil-alt'
    case 'DELETE':
      return 'trash'
    default:
      return null
  }
}
</script>
