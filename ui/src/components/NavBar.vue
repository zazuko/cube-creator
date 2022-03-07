<template>
  <nav class="navbar is-light has-shadow">
    <div class="navbar-brand">
      <router-link class="navbar-item" :to="{ name: 'Home' }">
        Cube Creator
      </router-link>
      <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" @click="isOpen = !isOpen">
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </a>
    </div>
    <div class="navbar-menu" :class="{ 'is-active': isOpen }">
      <div class="navbar-start">
        <router-link class="navbar-item" :to="{ name: 'CubeProjects' }">
          Cube Projects
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'SharedDimensions' }">
          Shared Dimensions
        </router-link>
        <router-link class="navbar-item" :to="{ name: 'Hierarchies' }">
          Hierarchies
        </router-link>
      </div>
      <div class="navbar-end">
        <a
          class="navbar-item"
          href="https://github.com/zazuko/cube-creator/wiki"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <o-icon icon="question-circle" />
          <span class="ml-1">Help</span>
        </a>
        <div class="navbar-item">
          <sign-out-button />
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import Vue from 'vue'
import SignOutButton from './auth/SignOutButton.vue'

export default Vue.extend({
  name: 'NavBar',
  components: { SignOutButton },

  data () {
    return {
      isOpen: false,
    }
  }
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
