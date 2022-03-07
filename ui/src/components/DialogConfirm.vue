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
import { defineComponent, PropType } from 'vue'
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'

export default defineComponent({
  name: 'DialogConfirm',
  props: {
    title: {
      type: String,
      default: 'Are you sure?',
    },
    message: {
      type: String,
      required: true,
    },
    confirmText: {
      type: String,
      default: 'Confirm',
    },
    variant: {
      type: String as PropType<ColorsModifiers>,
      default: 'danger',
    },
    hasIcon: {
      type: Boolean,
      default: true,
    },
  },

  computed: {
    icon () {
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
    },
  },

  methods: {
    onConfirm (): void {
      this.$emit('confirm')
      this.$emit('close')
    },

    onCancel (): void {
      this.$emit('cancel')
      this.$emit('close')
    },
  },
})
</script>
