<template>
  <div id="app">
    <nav-bar />
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import NavBar from '@/components/NavBar.vue'

export default Vue.extend({
  name: 'App',
  components: { NavBar },
})
</script>
