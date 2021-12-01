<template>
  <li class="mb-2">
    <strong>{{ propertyLabel(result.path) }}</strong>:&nbsp;
    <span v-if="result.message.length === 1">{{ result.message[0] }}</span>
    <ul v-else>
      <li v-for="(message, messageIndex) in result.message" :key="messageIndex">
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

@Component
export default class HydraOperationErrorResult extends Vue {
  @Prop({ default: null }) result!: any
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
}
</script>
