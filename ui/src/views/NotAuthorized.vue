<template>
  <div>
    <h2 class="title">
      Missing Authorization
    </h2>
    <p>
      You have not the right to access this site. Please request access it via
      <a :href="link"> {{ link }}</a>
    </p>
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'NotAuthorized',
  computed: {
    link: function () { return this.$router.currentRoute.params.link }
  },
})
</script>
