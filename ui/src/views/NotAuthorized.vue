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
import { defineComponent } from 'vue'
import PageContent from '@/components/PageContent.vue'

export default defineComponent({
  name: 'NotAuthorizedView',
  components: { PageContent },

  computed: {
    link (): string {
      return this.$route.params.link as string
    },
  },
})
</script>
