<template>
  <o-radio
    :value="value"
    :native-value="nativeValue"
    :size="size"
    @input="$emit('input', $event)"
    class="button radio-button"
    :class="{ 'is-primary': isSelected }"
  >
    <slot />
  </o-radio>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class RadioButton extends Vue {
  @Prop() value!: string
  @Prop() nativeValue!: string
  @Prop() size?: string

  get isSelected () {
    return this.value === this.nativeValue
  }
}
</script>

<style>
.b-radio.radio-button .check,
.b-radio.radio-button input[type=radio] {
  display: none;
}

.b-radio.radio-button > .control-label {
  padding-left: 0;
}
</style>
