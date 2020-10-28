<template>
  <router-view v-if="apiEntrypoint" />
  <b-loading v-else active :is-full-page="false" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Resource } from 'alcaeus'

const apiNS = namespace('api')

@Component
export default class AuthenticatedView extends Vue {
  @apiNS.State('entrypoint') apiEntrypoint!: Resource

  async mounted (): Promise<void> {
    await this.$store.dispatch('api/fetchEntrypoint')
  }
}
</script>
