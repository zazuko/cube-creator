<template>
  <b-tooltip v-if="operation" :label="operation.title">
    <b-button
      :tag="tag"
      :to="to"
      @click="$emit('click')"
      :type="type"
      :size="size"
      :icon-left="iconName"
      :disabled="disabled"
    >
      <slot />
    </b-button>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import { Location } from 'vue-router'

@Component
export default class HydraOperationButton extends Vue {
  @Prop({ default: null }) operation!: RuntimeOperation | null
  @Prop({ default: null }) to!: Location | null
  @Prop({ default: 'is-text' }) type!: string
  @Prop({ default: 'is-small' }) size!: string
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
