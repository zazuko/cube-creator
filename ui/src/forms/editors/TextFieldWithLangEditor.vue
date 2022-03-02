<template>
  <o-field>
    <o-input :value="valueText" @input="updateValue" class="text-input" :type="inputType" />
    <o-select :value="valueLanguage" @input="updateLanguage">
      <option v-for="language in languages" :key="language">
        {{ language }}
      </option>
    </o-select>
  </o-field>
</template>

<script lang="ts">
import { Literal } from 'rdf-js'
import * as $rdf from '@rdf-esm/data-model'
import { PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { Prop, Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  @Prop() value?: Literal
  @Prop() property?: PropertyState
  @Prop() update!: (newValue: Literal) => void
  @Prop({ default: 'text' }) inputType?: string

  get languages (): string[] {
    return this.property?.shape.languageIn || []
  }

  get valueText (): string {
    return this.value?.value || ''
  }

  get valueLanguage (): string | undefined {
    return this.value?.language
  }

  updateValue (newValue: string): void {
    this.update($rdf.literal(newValue, this.valueLanguage))
  }

  updateLanguage (newLanguage: string): void {
    this.update($rdf.literal(this.valueText, newLanguage))
  }
}
</script>

<style scoped>
.text-input {
  flex-grow: 1;
}
</style>
