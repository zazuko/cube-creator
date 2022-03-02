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
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class BLoading extends Vue {
  @Prop({ default: false }) active!: boolean
  @Prop({ default: true }) isFullPage!: boolean
  @Prop({ default: 'fade' }) animation!: string
}
</script>
