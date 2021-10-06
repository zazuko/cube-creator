<template>
  <router-view v-if="apiEntrypoint" />
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Resource } from 'alcaeus'
import LoadingBlock from '@/components/LoadingBlock.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { LoadingBlock },
})
export default class AuthenticatedView extends Vue {
  @storeNs.api.State('entrypoint') apiEntrypoint!: Resource

  async mounted (): Promise<void> {
    await this.$store.dispatch('api/fetchEntrypoint')
  }
}
</script>
