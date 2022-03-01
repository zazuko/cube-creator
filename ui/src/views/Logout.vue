<template>
  <section class="section">
    <b-message type="is-success">
      <p>
        You have been successfully logged out.
      </p>
      <p>
        <router-link :to="{ name: 'Home' }">
          Log in again
        </router-link>
      </p>
    </b-message>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import BMessage from '../components/BMessage.vue'
import * as storeNs from '../store/namespace'

@Component({
  components: { BMessage },
})
export default class LogoutView extends Vue {
  @storeNs.auth.Getter('oidcIsAuthenticated') isAuthenticated!: boolean

  mounted (): void {
    if (this.isAuthenticated) {
      this.$router.push({ name: 'Home' })
    }
  }
}
</script>
