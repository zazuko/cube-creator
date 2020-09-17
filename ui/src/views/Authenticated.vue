<template>
  <div>
    Hi, this is the homepage and you should only see it if logged in
    <router-view />
  </div>
</template>

<script>
import Vue from 'vue'
import { mapGetters } from 'vuex'

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
    })
  },
})
</script>
