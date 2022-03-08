<template>
  <o-tooltip v-if="operation" :label="operation.title">
    <o-button
      :tag="tag"
      :to="to"
      @click.stop="$emit('click')"
      :variant="variant"
      :size="size"
      :icon-left="iconName"
      :disabled="disabled"
      :label="label"
    />
  </o-tooltip>
</template>

<script lang="ts">
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { defineComponent, PropType } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import { RouteLocationRaw } from 'vue-router'

export default defineComponent({
  name: 'HydraOperationButton',
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      default: null,
    },
    to: {
      type: Object as PropType<RouteLocationRaw>,
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
    label: {
      type: String,
      default: null,
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
