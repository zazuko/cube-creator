<template>
  <span v-if="value">{{ value }}</span>
  <span v-else><slot>Missing value</slot></span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Literal } from 'rdf-js'

@Component
export default class extends Vue {
  @Prop() values?: Literal[]
  @Prop() selectedLanguage!: string

  get value (): string | undefined {
    const term =
      this.values?.find(({ language }) => language === this.selectedLanguage) ||
      this.values?.find(({ language }) => !language)

    return term?.value
  }
}
</script>
