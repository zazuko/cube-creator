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
import { Vue, Component, Prop } from 'vue-property-decorator'
import BLoading from './BLoading.vue'

@Component({
  components: { BLoading },
})
export default class ButtonLoading extends Vue {
  @Prop() nativeType?: string
  @Prop() variant?: string
  @Prop() size?: string
  @Prop() iconLeft?: string
  @Prop() disabled?: boolean
  @Prop() loading?: boolean

  get icon () {
    if (this.loading) {
      return 'spinner'
    } else {
      return this.iconLeft
    }
  }

  get iconClass () {
    return this.loading
      ? 'animate-spin'
      : ''
  }
}
</script>
