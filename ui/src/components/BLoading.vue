<template>
  <transition :name="animation">
    <div
      class="loading-overlay is-active"
      :class="{ 'is-full-page': isFullPage }"
      v-show="active"
    >
      <div class="loading-background" />
      <slot>
        <div class="loading-icon" />
      </slot>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BLoading',
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    isFullPage: {
      type: Boolean,
      default: true,
    },
    animation: {
      type: String,
      default: 'fade',
    }
  },
})
</script>
