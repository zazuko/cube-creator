<template>
  <router-view v-if="apiEntrypoint" />
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Resource } from 'alcaeus'
import LoadingBlock from '@/components/LoadingBlock.vue'

const apiNS = namespace('api')

@Component({
  components: { LoadingBlock },
})
export default class AuthenticatedView extends Vue {
  @apiNS.State('entrypoint') apiEntrypoint!: Resource

  async mounted (): Promise<void> {
    await this.$store.dispatch('api/fetchEntrypoint')
  }
}
</script>
