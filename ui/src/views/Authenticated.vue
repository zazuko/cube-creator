<template>
  <router-view v-if="apiEntrypoint" />
  <loading-block v-else />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { Resource } from 'alcaeus'
import LoadingBlock from '@/components/LoadingBlock.vue'

export default defineComponent({
  name: 'AuthenticatedView',
  components: { LoadingBlock },

  async mounted (): Promise<void> {
    await this.$store.dispatch('api/fetchEntrypoint')
  },

  computed: {
    apiEntrypoint (): Resource {
      return this.$store.state.api.entrypoint
    }
  },
})
</script>
