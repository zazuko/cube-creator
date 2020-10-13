<template>
  <div v-if="user">
    <b-button @click="signOut" icon-right="power-off" title="Sign out">
      {{ user.name }}
    </b-button>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapActions, mapGetters } from 'vuex'

export default Vue.extend({
  name: 'SignOutButton',

  computed: {
    ...mapGetters({
      user: 'auth/oidcUser',
    })
  },

  methods: {
    ...mapActions({
      signOut: 'auth/signOutOidc'
    }),
  },
})
</script>
