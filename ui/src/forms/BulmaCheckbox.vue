<template>
  <b-checkbox :value="value" @input="update" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() value?: boolean;
  @Prop() update!: (newValue: boolean) => void
}
</script>
