<template>
  <page-content class="container-narrow">
    <div v-if="hierarchy">
      <div class="mb-4 is-flex is-justify-content-space-between is-align-items-center gap-2">
        <div class="is-flex is-align-items-center gap-2">
          <h2 class="title is-size-4 mb-0">
            {{ hierarchy.name }}
          </h2>
        </div>
        <div class="is-flex is-align-items-center gap-1">
          <hydra-operation-button :operation="hierarchy.actions.replace" :to="{ name: 'HierarchyEdit' }" />
        </div>
      </div>
      Tree here

      <router-view />
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'SharedDimensionView',
  components: {
    HydraOperationButton,
    LoadingBlock,
    PageContent,
  },

  mounted (): void {
    this.$store.dispatch('sharedDimensions/fetchHierarchy', this.$route.params.id)
  },

  computed: {
    ...mapState('sharedDimensions', {
      hierarchy: 'hierarchy',
    }),
  },
})
</script>

<style scoped>
.table > thead > tr > * {
  vertical-align: middle;
}
</style>
