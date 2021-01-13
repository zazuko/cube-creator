<template>
  <color-picker class="color-picker" ref="input" :value="value" @input="emit" :palette="palette" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Compact } from 'vue-color'

const palette = [
  '#EF9A9A', '#F48FB1', '#CE93D8', '#B39DDB', '#9FA8DA',
  '#90CAF9', '#81D4FA', '#80DEEA', '#80CBC4', '#A5D6A7',
  '#C5E1A5', '#E6EE9C', '#FFF59D', '#FFE082', '#FFCC80',
  '#FFAB91', '#BCAAA4', '#EEEEEE', '#B0BEC5',
]

@Component({
  components: { ColorPicker: Compact },
})
export default class extends Vue {
  @Prop() value?: string;
  @Prop() update!: (newValue: string) => void

  mounted (): void {
    if (!this.value) {
      this.update(takeRandom(palette))
    }
  }

  emit (color: { hex: string }): void {
    this.update(color.hex)
  }

  get palette (): string[] {
    return palette
  }
}

function takeRandom<T> (array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}
</script>

<style>
.color-picker.vc-compact {
  width: 100%;
  max-width: 100%;
}

.color-picker .vc-compact-color-item {
  width: 2rem;
  height: 2rem;
}
</style>
