<template>
  <div id="app" class="is-flex is-flex-direction-column">
    <nav-bar />

    <div class="main is-flex-grow-1">
      <router-view />
    </div>

    <div class="messages">
      <o-notification
        v-for="(message, index) in messages"
        :key="index"
        :variant="message.variant"
        has-icon
        closable
        aria-close-label="Dismiss"
        @close="dismissMessage(message)"
        :auto-close="message.variant !== 'danger'"
        :duration="5000"
      >
        <h3 class="has-text-weight-bold">
          {{ message.title }}
        </h3>
        <p>
          {{ message.message }}
        </p>
      </o-notification>
    </div>

    <b-loading :active="isLoading" :is-full-page="true" />

    <footer class="mt-6 px-4 py-3 has-background-light">
      <p class="has-text-right is-size-7">
        version {{ release }}
      </p>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import BLoading from '@/components/BLoading.vue'
import NavBar from '@/components/NavBar.vue'
import { APIErrorAuthorization } from './api/errors'
import { Message } from './store/modules/app'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'App',
  components: { BLoading, NavBar },

  mounted (): void {
    this.$store.dispatch('app/loadCommonRDFProperties')

    window.addEventListener('vuexoidc:userLoaded', this.onUserLoaded)
  },

  destroyed (): void {
    window.removeEventListener('vuexoidc:userLoaded', this.onUserLoaded)
  },

  computed: {
    ...mapState('app', {
      isLoading: 'loading',
      messages: 'messages',
    }),

    release (): string {
      const commit = process.env.VUE_APP_COMMIT?.slice(0, 7) ?? 'dev'
      return `${process.env.VUE_APP_VERSION} (${commit})`
    },
  },

  methods: {
    onUserLoaded (): void {
      // Clear stale state in OIDC store to avoid "Request Header Or Cookie Too Large" error
      this.$store.dispatch('auth/clearStaleState')
    },

    dismissMessage (message: Message): void {
      this.$store.dispatch('app/dismissMessage', message)
    },

    errorCaptured (err: Error): false | void {
      if (err instanceof APIErrorAuthorization) {
        const link = err.details?.link?.href ?? ''
        this.$router.push({ name: 'NotAuthorized', params: { link } })
        return false
      }
    },
  },
})
</script>

<style>
html, body, #app {
  min-height: 100vh;
}
</style>

<style scoped>
.messages {
  position: fixed;
  bottom: 1em;
  right: 1em;
  z-index: 50;
}
</style>
