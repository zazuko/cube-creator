<template>
  <div class="section">
    <p>
      Authenticating...
    </p>
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'OidcCallback',

  async mounted () {
    try {
      const redirectPath = await this.$store.dispatch('auth/oidcSignInCallback')
      this.$router.push(redirectPath)
    } catch (err) {
      console.error(err)
      this.$router.push({ name: 'OidcError' })
    }
  },
})
</script>
