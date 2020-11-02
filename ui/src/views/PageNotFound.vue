<template>
  <page-content>
    <h2 class="title">
      Page not found
    </h2>
  </page-content>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import PageContent from '@/components/PageContent.vue'

@Component({
  components: { PageContent },
})
export default class PageNotFoundView extends Vue {
}
</script>
