<template>
  <b-navbar type="is-light" shadow>
    <template slot="brand">
      <b-navbar-item tag="router-link" :to="{ name: 'Home' }">
        Cube Creator
      </b-navbar-item>
    </template>
    <template slot="start">
      <router-link
        :to="{ name: 'CubeProjects' }"
        v-slot="{ href, isActive }"
        custom
      >
        <b-navbar-item tag="a" :href="href" :class="{ active: isActive }">
          Cube Projects
        </b-navbar-item>
      </router-link>
    </template>
    <template slot="start">
      <router-link
        :to="{ name: 'SharedDimensions' }"
        v-slot="{ href, isActive }"
        custom
      >
        <b-navbar-item tag="a" :href="href" :class="{ active: isActive }">
          Shared Dimensions
        </b-navbar-item>
      </router-link>
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
.navbar-item.active {
  font-weight: bold;
  color: #aaa;
}
</style>
