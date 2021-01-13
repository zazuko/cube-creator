<template>
  <b-checkbox :value="value" @input="emit" />
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { literal } from '@rdf-esm/data-model'
import { xsd } from '@tpluscode/rdf-ns-builders'

@Component
export default class extends Vue {
  @Prop() value?: boolean;
  @Prop() update!: (newValue: Term | string) => void;

  emit (value: boolean): void {
    this.update(literal(value.toString(), xsd.boolean))
  }
}
</script>
