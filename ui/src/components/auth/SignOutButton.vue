<template>
  <div v-if="user">
    <b-button @click="signOut" icon-right="power-off" title="Sign out">{{ user.name }}</b-button>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'SignOutButton',

  computed: {
    ...mapGetters({
      user: 'auth/oidcUser',
    })
  },

  methods: {
    async signOut () {
      await this.$store.dispatch('auth/signOutOidcSilent')
      window.location.reload()
    },
  },
})
</script>
