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
import { defineComponent, PropType } from 'vue'
import type { Shape } from '@rdfine/shacl'
import $rdf from '@cube-creator/env'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ValidationReport } from '@/api/errors'

export default defineComponent({
  name: 'HydraOperationErrorResult',
  props: {
    result: {
      type: Object as PropType<ValidationReport>,
      required: true,
    },
    shape: {
      type: Object as PropType<Shape | null>,
      default: null,
    },
  },

  computed: {
    usefullMessages (): string[] {
      return this.result.message.filter((message: string) => !message.startsWith('Value does not have shape'))
    },
  },

  methods: {
    propertyLabel (uri: string | undefined): string {
      if (!uri) return ''

      const shrunkProperty = uri.split('#').slice(-1)[0]

      if (!this.shape) return shrunkProperty

      const label = this.shape.pointer.any()
        .has(sh.path, $rdf.namedNode(uri))
        .out(sh.name, { language: ['en', ''] })
        .value

      return label || shrunkProperty
    },
  },
})
</script>
