<template>
  <div class="section">
    <p>
      Authenticating...
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
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
