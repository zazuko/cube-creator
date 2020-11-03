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
        :title="message.title || ' '"
        :type="message.type"
        has-icon
        aria-close-label="Dismiss"
        @close="dismissMessage(message)"
        :auto-close="message.type !== 'is-danger'"
        :duration="7000"
      >
        {{ message.message }}
      </b-message>
    </div>

    <b-loading :active="isLoading" :is-full-page="true" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NavBar from '@/components/NavBar.vue'
import { namespace } from 'vuex-class'
import { APIErrorAuthorization } from './api/errors'
import { Message } from '@/store/modules/app'

const appNS = namespace('app')

@Component({
  components: { NavBar },
})
export default class App extends Vue {
  @appNS.State('loading') isLoading!: boolean
  @appNS.State('messages') messages!: Message[]

  dismissMessage (message: Message): void {
    this.$store.dispatch('app/dismissMessage', message)
  }

  errorCaptured (err: Error): false | void {
    if (err instanceof APIErrorAuthorization) {
      const link = err.details?.link?.href ?? ''
      this.$router.push({ name: 'NotAuthorized', params: { link } })
      return false
    }
  }
}
</script>

<style scoped>
.messages {
  position: fixed;
  bottom: 1em;
  right: 1em;
  z-index: 50;
}
</style>
