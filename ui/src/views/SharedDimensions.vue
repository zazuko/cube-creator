<template>
  <page-content class="container-narrow">
    <div class="mb-4 is-flex is-align-items-center is-justify-content-space-between">
      <h2 class="title is-size-4 mb-0">
        Shared Dimensions
      </h2>
      <div v-if="collection">
        <hydra-operation-button
          :operation="collection.actions.create"
          :to="{ name: 'SharedDimensionCreate' }"
          variant="default"
          size="normal"
        >
          {{ collection.actions.create.title }}
        </hydra-operation-button>
      </div>
    </div>
    <div v-if="collection">
      <div v-if="dimensions.length > 0" class="panel">
        <router-link
          v-for="dimension in dimensions"
          :key="dimension.id.value"
          :to="{ name: 'SharedDimension', params: { id: dimension.clientPath } }"
          class="panel-block"
        >
          <div class="is-flex-grow-1 is-flex is-justify-content-space-between">
            <div class="is-flex is-justify-content-space-between">
              <p class="has-text-weight-bold">
                {{ dimension.name }}
              </p>
            </div>
            <shared-dimension-tags :dimension="dimension" />
          </div>
        </router-link>
      </div>
      <p v-else class="has-text-grey">
        No shared dimension yet
      </p>
    </div>
    <loading-block v-else />

    <router-view v-if="collection" />
  </page-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import SharedDimensionTags from '@/components/SharedDimensionTags.vue'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'CubeProjectsView',
  components: { PageContent, LoadingBlock, HydraOperationButton, SharedDimensionTags },

  async mounted (): Promise<void> {
    await this.$store.dispatch('sharedDimensions/fetchEntrypoint')
    await this.$store.dispatch('sharedDimensions/fetchCollection')
  },

  computed: {
    ...mapState('sharedDimensions', {
      collection: 'collection',
    }),
    ...mapGetters('sharedDimensions', {
      dimensions: 'dimensions',
    }),
  },
})
</script>
