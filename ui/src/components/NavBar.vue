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
        <router-link :to="{ name: 'CubeProjects' }" v-slot="{ href, navigate, route }" custom>
          <a :href="href" @click="navigate" class="navbar-item" :class="{ 'is-active': isRouteActive(route, $route) }">
            Cube Projects
          </a>
        </router-link>
        <router-link :to="{ name: 'SharedDimensions' }" v-slot="{ href, navigate, route }" custom>
          <a :href="href" @click="navigate" class="navbar-item" :class="{ 'is-active': isRouteActive(route, $route) }">
            Shared Dimensions
          </a>
        </router-link>
        <router-link :to="{ name: 'Hierarchies' }" v-slot="{ href, navigate, route }" custom>
          <a :href="href" @click="navigate" class="navbar-item" :class="{ 'is-active': isRouteActive(route, $route) }">
            Hierarchies
          </a>
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

<script lang="ts">
import { defineComponent } from 'vue'
import SignOutButton from './auth/SignOutButton.vue'
import { isRouteActive } from '../router'

export default defineComponent({
  name: 'NavBar',
  components: { SignOutButton },

  data () {
    return {
      isOpen: false,
    }
  },

  methods: {
    isRouteActive,
  },
})
</script>

<style scoped>
.navbar-item.is-active {
  font-weight: bold;
  color: #aaa;
}

.navbar-brand .navbar-item.router-link-active {
  font-weight: normal;
}
</style>
