<template>
  <div class="home">
    Hi, this is the homepage and you should only see it if logged in
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  components: {},

  computed: {
    ...mapGetters({
      token: 'auth/oidcAccessToken',
      user: 'auth/oidcUser',
    })
  },
}
</script>
