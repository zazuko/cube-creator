<template>
  <div>Authenticating...</div>
</template>

<script>
export default {
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
}
</script>
