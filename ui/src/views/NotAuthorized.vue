<template>
  <page-content>
    <h2 class="title">
      Missing Authorization
    </h2>
    <p>
      You have not the right to access this site. Please request access it via
      <a :href="link"> {{ link }}</a>
    </p>
  </page-content>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import PageContent from '@/components/PageContent.vue'

@Component({
  components: { PageContent },
})
export default class NotAuthorizedView extends Vue {
  get link (): string | null {
    return this.$router.currentRoute.params.link
  }
}
</script>
