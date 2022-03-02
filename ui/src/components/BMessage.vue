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
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class BMessage extends Vue {
  @Prop() type?: string
  @Prop() size?: string
  @Prop() title?: string
}
</script>
