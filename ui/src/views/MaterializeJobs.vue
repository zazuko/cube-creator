<template>
  <div>
    <div class="mb-1">
      <o-button tag="router-link" :to="{ name: 'Materialize' }" icon-left="arrow-left" size="small">
        Back to {{ materializeLabel }}
      </o-button>
    </div>
    <div class="box container-narrow">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'MaterializeJobs',

  computed: {
    ...mapGetters('project', {
      materializeLabel: 'materializeLabel',
    }),
  },
})
</script>
