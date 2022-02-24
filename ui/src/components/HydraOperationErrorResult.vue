<template>
  <li class="mb-2">
    <strong>{{ propertyLabel(result.path) }}</strong>:&nbsp;
    <span v-if="usefullMessages.length === 1">
      {{ usefullMessages[0] }}
    </span>
    <ul v-else class="mb-2">
      <li v-for="(message, messageIndex) in usefullMessages" :key="messageIndex">
        {{ message }}
      </li>
    </ul>
    <ul v-if="result.detail && result.detail.length > 0" class="pl-4">
      <hydra-operation-error-result
        v-for="(detail, detailIndex) in result.detail"
        :key="detailIndex"
        :result="detail"
        :shape="shape"
      />
    </ul>
  </li>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import type { Shape } from '@rdfine/shacl'
import $rdf from '@rdf-esm/data-model'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ValidationReport } from '@/api/errors'

@Component({
  // Define `name` to allow recursive call
  name: 'hydra-operation-error-result',
})
export default class HydraOperationErrorResult extends Vue {
  @Prop({ default: null }) result!: ValidationReport
  @Prop({ default: null }) shape!: Shape | null

  propertyLabel (uri: string | undefined): string {
    if (!uri) return ''

    const shrunkProperty = uri.split('#').slice(-1)[0]

    if (!this.shape) return shrunkProperty

    const label = this.shape.pointer.any()
      .has(sh.path, $rdf.namedNode(uri))
      .out(sh.name, { language: ['en', ''] })
      .value

    return label || shrunkProperty
  }

  get usefullMessages (): string[] {
    return this.result.message.filter((message: string) => !message.startsWith('Value does not have shape'))
  }
}
</script>
