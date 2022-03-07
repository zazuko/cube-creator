<template>
  <div v-if="user">
    <o-button @click="signOut" icon-right="power-off" title="Sign out">
      {{ user.name }}
    </o-button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'SignOutButton',

  computed: {
    ...mapGetters('auth', {
      user: 'oidcUser',
    })
  },

  methods: {
    signOut (): void {
      this.$store.dispatch('auth/signOutOidc')
    },
  },
})
</script>
