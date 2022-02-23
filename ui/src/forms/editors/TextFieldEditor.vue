<template>
  <b-input :value="value" @input="update" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() value?: string
  @Prop() update!: (newValue: string) => void
}
</script>
