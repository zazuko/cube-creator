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
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { Location } from 'vue-router'

@Component
export default class HydraOperationButton extends Vue {
  @Prop({ default: null }) operation!: RuntimeOperation | null
  @Prop({ default: null }) to!: Location | null
  @Prop({ default: 'text' }) variant!: string
  @Prop({ default: 'small' }) size!: string
  @Prop({ default: null }) icon!: string | null
  @Prop({ default: false }) disabled!: boolean

  get tag (): string {
    return this.to ? 'router-link' : 'button'
  }

  get iconName (): string | null {
    return this.icon || guessIcon(this.operation)
  }
}

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
