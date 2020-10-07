<template>
  <div class="quickview" :class="{ 'is-active': isOpen }">
    <header class="quickview-header">
      <h2>{{ title }}</h2>
      <button class="delete" @click="$emit('close')" />
    </header>

    <div class="quickview-body">
      <slot />
    </div>
    <!-- <footer class="quickview-footer"></footer> -->
  </div>
</template>

<style scoped>
  .quickview-body {
    padding: 1rem;
  }
</style>

<script>
import Quickview from 'bulma-quickview/dist/js/bulma-quickview'
import 'bulma-quickview/dist/css/bulma-quickview.min.css'

export default {
  name: 'SidePane',
  props: {
    isOpen: Boolean,
    title: { type: String, required: true },
  },

  data () {
    return {
      quickview: null
    }
  },

  mounted () {
    this.$nextTick(() => {
      this.quickview = new Quickview(this.$el, {})
    })
  }
}
</script>
