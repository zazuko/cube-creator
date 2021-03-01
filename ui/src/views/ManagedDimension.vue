<template>
  <page-content>
    <div v-if="dimension">
      <div class="mb-4">
        <h2 class="title is-size-4 mb-0">
          <term-with-language :values="dimension.name" :selected-language="language" />
        </h2>
        <hydra-operation-button
          :operation="dimension.actions.edit"
          :to="{ name: 'ManagedDimensionEdit' }"
          type="is-default"
          size=""
        />
      </div>
      <table class="table is-narrow is-fullwidth">
        <thead>
          <tr>
            <th>Name</th>
            <th>Identifiers</th>
            <th>
              <hydra-operation-button
                v-if="dimension.actions.create"
                :operation="dimension.actions.create"
                :to="{ name: 'ManagedTermCreate' }"
                type="is-default"
                size=""
              >
                {{ dimension.actions.create.title }}
              </hydra-operation-button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="3">
              No term in this dimension yet. Do you want to
              <router-link :to="{ name: 'ManagedTermCreate' }">
                create one
              </router-link>?
            </td>
          </tr>
        </tbody>
      </table>

      <router-view />
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'

const appNS = namespace('app')
const managedDimensionNS = namespace('managedDimension')

interface ManagedDimension {
  name: string
}

@Component({
  components: { HydraOperationButton, LoadingBlock, PageContent, TermWithLanguage },
})
export default class extends Vue {
  @appNS.State('language') language!: string
  @managedDimensionNS.State('dimension') dimension!: ManagedDimension | null

  mounted (): void {
    const id = this.$route.params.id
    this.$store.dispatch('managedDimension/fetchDimension', id)
  }
}
</script>
