<template>
  <div id="app">
    <nav-bar />
    <div class="main">
      <router-view />
    </div>

    <div class="messages">
      <b-message
        v-for="(message, index) in messages"
        :key="index"
        :title="message.title"
        :type="message.type"
        has-icon
        aria-close-label="Dismiss"
        @close="dismissMessage(message)"
      >
        {{ message.message }}
      </b-message>
    </div>

    <b-loading :active="isLoading" :is-full-page="true" />
  </div>
</template>

<script>
import Vue from 'vue'
import NavBar from '@/components/NavBar.vue'
import { mapState } from 'vuex'
import { APIErrorAuthorization } from './api/errors'

export default Vue.extend({
  name: 'App',
  components: { NavBar },

  computed: {
    ...mapState({
      isLoading: (state) => state.app.loading,
      messages: (state) => state.app.messages,
    }),
  },

  methods: {
    dismissMessage (message) {
      this.$store.dispatch('app/dismissMessage', message)
    },
  },
  errorCaptured (err) {
    if (err instanceof APIErrorAuthorization) {
      this.$router.push({ name: 'NotAuthorized', params: { link: err.details.link.href } })
    }
    return false
  }
})
</script>

<style scoped>
.messages {
  position: fixed;
  bottom: 1em;
  right: 1em;
  z-index: 50;
}
</style>
