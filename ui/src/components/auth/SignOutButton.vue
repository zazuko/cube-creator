<template>
  <div v-if="user">
    <b-button @click="signOut" icon-right="power-off" title="Sign out">{{ user.name }}</b-button>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'SignOutButton',

  computed: {
    ...mapGetters({
      user: 'auth/oidcUser',
    })
  },

  methods: {
    ...mapActions({
      signOut: 'auth/signOutOidc',
    })
  },
}
</script>
