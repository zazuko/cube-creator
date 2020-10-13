<template>
  <section class="section">
    <b-message type="is-success">
      <p>
        You have been successfully logged out.
      </p>
      <p>
        <router-link :to="{ name: 'Home' }">
          Log in again
        </router-link>
      </p>
    </b-message>
  </section>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapGetters } from 'vuex'

export default Vue.extend({
  name: 'Logout',

  mounted () {
    if (this.isAuthenticated) {
      this.$router.push({ name: 'Home' })
    }
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/oidcIsAuthenticated',
    })
  },
})
</script>
