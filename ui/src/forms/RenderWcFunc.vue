<template>
  <div />
</template>

<script>
import Vue from 'vue'
import { render } from 'lit-html'

export default Vue.extend({
  name: 'RenderWc',
  props: ['f', 'args'],

  mounted () {
    this.renderComponent()
  },

  watch: {
    args () {
      this.renderComponent()
    }
  },

  methods: {
    renderComponent () {
      render(this.f(...this.args), this.$el)
    }
  }
})
</script>
