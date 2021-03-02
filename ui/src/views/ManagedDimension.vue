<template>
  <page-content class="container-narrow">
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
      <table class="table is-narrow is-bordered is-striped is-fullwidth" v-if="terms">
        <thead>
          <tr>
            <th>
              Name
            </th>
            <th>
              Identifiers
            </th>
            <td class="has-text-right">
              <hydra-operation-button
                v-if="dimension.actions.create"
                :operation="dimension.actions.create"
                :to="{ name: 'ManagedTermCreate' }"
                type="is-default"
                size=""
              >
                {{ dimension.actions.create.title }}
              </hydra-operation-button>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-for="term in terms" :key="term.clientPath">
            <td>
              <p v-for="(name, index) in term.name" :key="index">
                <term-display :key="name.value" :term="name" :show-language="true" />
              </p>
            </td>
            <td>
              <p v-for="(identifier, index) in term.identifiers" :key="index">
                {{ identifier }}
              </p>
            </td>
            <td>
              <hydra-operation-button
                :operation="term.actions.edit"
                :to="{ name: 'ManagedTermEdit' }"
                type="is-default"
                size=""
              />
              <hydra-operation-button
                :operation="term.actions.delete"
                type="is-default"
                size=""
              />
            </td>
          </tr>
          <tr v-if="terms.length === 0">
            <td colspan="3">
              No term in this dimension yet. Do you want to
              <router-link :to="{ name: 'ManagedTermCreate' }">
                create one
              </router-link>?
            </td>
          </tr>
        </tbody>
      </table>
      <loading-block v-else />

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
import TermDisplay from '@/components/TermDisplay.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import { ManagedDimension, ManagedTerm } from '@/store/types'

const appNS = namespace('app')
const managedDimensionNS = namespace('managedDimension')

@Component({
  components: { HydraOperationButton, LoadingBlock, PageContent, TermDisplay, TermWithLanguage },
})
export default class extends Vue {
  @appNS.State('language') language!: string
  @managedDimensionNS.State('dimension') dimension!: ManagedDimension | null
  @managedDimensionNS.State('terms') terms!: ManagedTerm[] | null

  mounted (): void {
    const id = this.$route.params.id
    this.$store.dispatch('managedDimension/fetchDimension', id)
  }
}
</script>

<style scoped>
.table > thead > tr > * {
  vertical-align: middle;
}
</style>
