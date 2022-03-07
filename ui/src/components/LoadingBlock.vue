<template>
  <div class="loading-block section">
    <b-loading :active="true" :is-full-page="false" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import BLoading from './BLoading.vue'

export default defineComponent({
  name: 'LoadingBlock',
  components: { BLoading },
})
</script>

<style scoped>
.loading-block {
  position: relative;
}
</style>
