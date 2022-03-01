<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">
        {{ title }}
      </p>
      <button class="delete" aria-label="close" @click="onCancel" />
    </header>
    <section class="modal-card-body">
      <div :class="{ media: hasIcon }">
        <div class="media-left">
          <o-icon
            v-if="icon"
            :icon="icon"
            :variant="variant"
            size="large"
            both
            aria-hidden
          />
        </div>
        <div class="media-content">
          {{ message }}
        </div>
      </div>
    </section>
    <footer class="modal-card-foot">
      <o-button @click="onCancel">
        Cancel
      </o-button>
      <o-button :variant="variant" @click="onConfirm">
        {{ confirmText }}
      </o-button>
    </footer>
  </div>
</template>

<script lang="ts">
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class DialogConfirm extends Vue {
  @Prop({ default: 'Are you sure?' }) title!: string
  @Prop({ required: true }) message!: string
  @Prop({ default: 'Confirm' }) confirmText!: string
  @Prop({ default: 'danger' }) variant!: ColorsModifiers
  @Prop({ default: true }) hasIcon!: boolean

  onConfirm (): void {
    this.$emit('confirm')
    this.$emit('close')
  }

  onCancel (): void {
    this.$emit('cancel')
    this.$emit('close')
  }

  get icon () {
    if (!this.hasIcon) {
      return null
    }

    switch (this.variant) {
      case 'info':
        return 'information'
      case 'success':
        return 'check-circle'
      case 'warning':
        return 'alert'
      case 'danger':
        return 'alert-circle'
      default:
        return null
    }
  }
}
</script>
