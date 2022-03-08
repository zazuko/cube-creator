<template>
  <page-content class="container-narrow">
    <div class="mb-4 is-flex is-align-items-center is-justify-content-space-between">
      <h2 class="title is-size-4 mb-0">
        Hierarchies
      </h2>
      <div v-if="collection">
        <hydra-operation-button
          :operation="collection.actions.create"
          :to="{ name: 'HierarchyCreate' }"
          variant="default"
          size="normal"
          :label="collection.actions.create.title"
        />
      </div>
    </div>
    <div v-if="collection" class="panel">
      <div v-if="collection.member.length > 0">
        <router-link
          v-for="hierarchy in collection.member"
          :key="hierarchy.id.value"
          :to="{ name: 'Hierarchy', params: { id: hierarchy.clientPath } }"
          class="panel-block"
        >
          <div class="is-flex-grow-1 is-flex is-justify-content-space-between">
            <div class="is-flex is-justify-content-space-between">
              <p class="has-text-weight-bold">
                {{ hierarchy.getString('http://schema.org/name') }}
              </p>
            </div>
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
import { mapState } from 'vuex'

export default defineComponent({
  name: 'HierarchiesView',
  components: { PageContent, LoadingBlock, HydraOperationButton },

  computed: {
    ...mapState('sharedDimensions', {
      collection: 'hierarchies',
    })
  },

  async mounted (): Promise<void> {
    await this.$store.dispatch('sharedDimensions/fetchEntrypoint')
    await this.$store.dispatch('sharedDimensions/fetchHierarchies')
  },
})
</script>
