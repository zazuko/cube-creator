<template>
  <page-content>
    <h2 class="title">
      Page not found
    </h2>
  </page-content>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import PageContent from '@/components/PageContent.vue'

export default defineComponent({
  name: 'PageNotFoundView',
  components: { PageContent },
})
</script>
