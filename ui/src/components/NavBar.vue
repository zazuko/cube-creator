<template>
  <b-navbar type="is-light" shadow>
    <template slot="brand">
      <b-navbar-item tag="router-link" :to="{ name: 'Home' }">
        Cube Creator
      </b-navbar-item>
    </template>
    <template slot="start">
      <b-navbar-item tag="router-link" :to="{ name: 'CubeProjects' }">
        Cube Projects
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ name: 'SharedDimensions' }">
        Shared Dimensions
      </b-navbar-item>
      <b-navbar-item tag="router-link" :to="{ name: 'Hierarchies' }">
        Hierarchies
      </b-navbar-item>
    </template>
    <template slot="end">
      <b-navbar-item
        href="https://github.com/zazuko/cube-creator/wiki"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        <b-icon icon="question-circle" />
        <span>Help</span>
      </b-navbar-item>
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

<style scoped>
.navbar-item.router-link-active {
  font-weight: bold;
  color: #aaa;
}

.navbar-brand .navbar-item.router-link-active {
  font-weight: normal;
}
</style>
