<template>
  <b-message v-if="error" type="is-danger" :title="error.title" class="error-message">
    <div class="">
      <p v-if="error.detail && !error.report">
        {{ error.detail }}
      </p>
      <ul v-if="error.report" class="">
        <li v-for="(reportError, reportIndex) in error.report" :key="reportIndex" class="mb-2">
          <strong>{{ propertyLabel(reportError.path) }}</strong>:&nbsp;
          <span v-if="reportError.message.length === 1">{{ reportError.message[0] }}</span>
          <ul v-else>
            <li v-for="(message, messageIndex) in reportError.message" :key="messageIndex">
              {{ message }}
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </b-message>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import type { Shape } from '@rdfine/shacl'
import $rdf from '@rdf-esm/data-model'
import { ErrorDetails } from '@/api/errors'
import { sh } from '@tpluscode/rdf-ns-builders'

@Component
export default class extends Vue {
  @Prop({ default: null }) error!: ErrorDetails | null
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
