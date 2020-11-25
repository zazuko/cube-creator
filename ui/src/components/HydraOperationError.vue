<template>
  <b-message v-if="error" type="is-danger" :title="error.title" class="error-message">
    <p v-if="error.detail">
      {{ error.detail }}
    </p>
    <ul v-if="error.report">
      <li v-for="(reportError, reportIndex) in error.report" :key="reportIndex">
        {{ shrink(reportError.path) }}
        <ul>
          <li v-for="(message, messageIndex) in reportError.message" :key="messageIndex">
            {{ message }}
          </li>
        </ul>
      </li>
    </ul>
  </b-message>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { ErrorDetails } from '@/api/errors'

@Component
export default class extends Vue {
  @Prop({ default: null }) error!: ErrorDetails | null

  shrink (uri: string | undefined): string {
    return uri ? uri.split('#').slice(-1)[0] : ''
  }
}
</script>
