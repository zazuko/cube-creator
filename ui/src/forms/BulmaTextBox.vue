<template>
  <b-input ref="input" @blur="emit" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() value?: string;
  @Prop() update!: (newValue: string) => void

  emit (ev: any): void {
    this.update(ev.target.value)
  }
}
</script>
