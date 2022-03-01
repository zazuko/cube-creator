<template>
  <div class="loading-block section">
    <b-loading :active="true" :is-full-page="false" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import BLoading from './BLoading.vue'

@Component({
  components: { BLoading },
})
export default class LoadingBlock extends Vue {}
</script>

<style scoped>
.loading-block {
  position: relative;
}
</style>
