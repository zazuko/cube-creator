<template>
  <router-view v-if="apiEntrypoint" />
  <b-loading v-else active :is-full-page="false" />
</template>

<script>
import Vue from 'vue'
import { mapGetters, mapState } from 'vuex'

export default Vue.extend({
  name: 'Authenticated',
  components: {},

  async mounted () {
    await this.$store.dispatch('api/fetchEntrypoint')
  },

  computed: {
    ...mapGetters({
      token: 'auth/oidcAccessToken',
      user: 'auth/oidcUser',
    }),
    ...mapState({
      apiEntrypoint: (state) => state.api.entrypoint,
    }),
  },
})
</script>
