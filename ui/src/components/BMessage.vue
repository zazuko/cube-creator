<template>
  <article class="message" :class="[type, size]">
    <header v-if="$slots.header || title" class="message-header">
      <div v-if="$slots.header">
        <slot name="header" />
      </div>
      <p v-else-if="title">
        {{ title }}
      </p>
    </header>
    <section class="message-body" v-if="$slots.default">
      <slot />
    </section>
  </article>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'BMessage',
  props: {
    type: {
      type: String,
      default: undefined,
    },
    size: {
      type: String,
      default: undefined,
    },
    title: {
      type: String,
      default: undefined,
    },
  },
})
</script>
