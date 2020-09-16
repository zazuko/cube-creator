<template>
  <b-navbar>
    <template slot="brand">
      <b-navbar-item tag="router-link" :to="{ name: 'Home' }">
        Cube Creator
      </b-navbar-item>
    </template>
    <template slot="end">
      <b-navbar-item>
        <sign-out-button />
      </b-navbar-item>
    </template>
  </b-navbar>
</template>

<script>
import Vue from 'vue'
import SignOutButton from './auth/SignOutButton.vue'

export default Vue.extend({
  name: 'NavBar',
  components: { SignOutButton },
})
</script>
