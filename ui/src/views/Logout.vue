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
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'
import BMessage from '../components/BMessage.vue'

export default defineComponent({
  name: 'LogoutView',
  components: { BMessage },

  mounted (): void {
    if (this.isAuthenticated) {
      this.$router.push({ name: 'Home' })
    }
  },

  computed: {
    ...mapGetters('auth', {
      isAuthenticated: 'oidcIsAuthenticated',
    })
  },
})
</script>
