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
          type="is-default"
          size=""
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
            <div>
              <p class="has-text-weight-bold">
                <term-with-language :values="dimension.name" :selected-language="language" />
              </p>
            </div>
            <div v-if="dimension.maintainer" class="is-flex is-flex-direction-column is-align-items-flex-end">
              <p class="tag">
                {{ dimension.maintainer.label }}
              </p>
              <p class="is-size-7 pr-2" v-if="dimension.creator && dimension.creator.name">
                {{ dimension.creator.name }}
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
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Collection } from 'alcaeus'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import { SharedDimension } from '@/store/types'

const appNS = namespace('app')
const sharedDimensionsNS = namespace('sharedDimensions')

@Component({
  components: { PageContent, LoadingBlock, HydraOperationButton, TermWithLanguage },
})
export default class CubeProjectsView extends Vue {
  @appNS.State('language') language!: string
  @sharedDimensionsNS.State('collection') collection!: Collection | null
  @sharedDimensionsNS.Getter('dimensions') dimensions!: SharedDimension[]

  async mounted (): Promise<void> {
    await this.$store.dispatch('sharedDimensions/fetchEntrypoint')
    await this.$store.dispatch('sharedDimensions/fetchCollection')
  }
}
</script>
