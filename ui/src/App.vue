<template>
  <div id="app">
    <nav-bar />
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue'

export default {
  name: 'App',
  components: { NavBar },
}
</script>

<style scoped>
.main {
  padding: 0 0.75em;
}
</style>
