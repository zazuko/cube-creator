<template>
  <page-content class="container-narrow">
    <div v-if="dimension">
      <div class="mb-4 is-flex is-justify-content-space-between is-align-items-center gap-2">
        <div class="is-flex is-align-items-center gap-2">
          <h2 class="title is-size-4 mb-0">
            {{ dimension.name }}
          </h2>
          <shared-dimension-tags :dimension="dimension" />
        </div>
        <div class="is-flex is-align-items-center gap-1">
          <hydra-operation-button :operation="dimension.actions.replace" :to="{ name: 'SharedDimensionEdit' }" />
          <hydra-operation-button :operation="dimension.actions.delete" @click="deleteDimension(dimension)" />
          <download-button :resource="dimension.export" size="is-small" type="is-white" />
        </div>
      </div>
      <table class="table is-narrow is-bordered is-striped is-fullwidth">
        <thead class="has-background-light">
          <tr>
            <th>
              URI
            </th>
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
                :to="{ name: 'SharedDimensionTermCreate' }"
                type="is-default"
              >
                {{ dimension.actions.create.title }}
              </hydra-operation-button>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr v-if="terms.isLoading">
            <td :colspan="tableWidth" class="p-0">
              <loading-block class="has-background-light is-size-2" :style="`height: calc(38px * ${this.pageSize});`" />
            </td>
          </tr>
          <tr v-else-if="terms.error">
            <td :colspan="tableWidth">
              <b-message type="is-danger">
                {{ terms.error }}
              </b-message>
            </td>
          </tr>
          <tr v-else-if="terms.data.length === 0 && page === 1">
            <td :colspan="tableWidth">
              Nothing in this dimension yet.
              <span v-if="dimension.actions.create">
                Do you want to
                <router-link :to="{ name: 'SharedDimensionTermCreate' }">
                  add a term
                </router-link>?
              </span>
            </td>
          </tr>
          <tr v-else-if="terms.data.length === 0">
            <td :colspan="tableWidth">
              You reached the end of terms
            </td>
          </tr>
          <tr v-else v-for="term in terms.data" :key="term.clientPath" :class="{ 'has-background-success-light': term.newlyCreated }">
            <td class="has-text-sm">
              <term-display :term="term.canonical || term.id" />
            </td>
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
              <div class="is-flex is-justify-content-space-between">
                <div>
                  <b-tag v-if="term.validThrough <= new Date()" type="is-warning is-light">
                    deprecated
                  </b-tag>
                </div>
                <div>
                  <hydra-operation-button
                    :operation="term.actions.replace"
                    :to="{ name: 'SharedDimensionTermEdit', params: { termId: term.clientPath } }"
                  />
                  <hydra-operation-button :operation="term.actions.delete" @click="deleteTerm(term)" />
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td :colspan="tableWidth" class="has-background-light">
              <div class="is-flex gap-4">
                <div class="is-flex is-align-items-center gap-1">
                  <span class="pr-1">Page {{ page }}</span>
                  <b-tooltip label="Previous page">
                    <b-button
                      icon-left="chevron-left"
                      @click="prevPage"
                      :disabled="!terms.data || page === 1"
                    />
                  </b-tooltip>
                  <b-tooltip label="Next page">
                    <b-button
                      icon-left="chevron-right"
                      @click="nextPage"
                      :disabled="!terms.data || terms.data.length === 0"
                    />
                  </b-tooltip>
                </div>
                <b-tooltip label="Page size">
                  <b-select :value="pageSize" @input="changePageSize" title="Page size">
                    <option v-for="pageSizeOption in pageSizes" :key="pageSizeOption" :native-value="pageSizeOption">
                      {{ pageSizeOption }}
                    </option>
                  </b-select>
                </b-tooltip>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      <router-view />
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import SharedDimensionTags from '@/components/SharedDimensionTags.vue'
import TermDisplay from '@/components/TermDisplay.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import DownloadButton from '@/components/DownloadButton.vue'
import * as storeNs from '../store/namespace'
import { SharedDimension, SharedDimensionTerm } from '../store/types'

@Component({
  components: {
    HydraOperationButton,
    LoadingBlock,
    PageContent,
    SharedDimensionTags,
    TermDisplay,
    TermWithLanguage,
    DownloadButton
  },
})
export default class extends Vue {
  @storeNs.sharedDimension.State('dimension') dimension!: SharedDimension | null
  @storeNs.sharedDimension.State('terms') terms!: SharedDimensionTerm[] | null
  @storeNs.sharedDimension.State('page') page!: number
  @storeNs.sharedDimension.State('pageSize') pageSize!: number
  @storeNs.sharedDimension.Action('nextPage') nextPage!: () => any
  @storeNs.sharedDimension.Action('prevPage') prevPage!: () => any
  @storeNs.sharedDimension.Action('changePageSize') changePageSize!: () => any

  pageSizes = [10, 20, 50, 100]
  tableWidth = 4

  mounted (): void {
    const id = this.$route.params.id
    this.$store.dispatch('sharedDimension/fetchDimension', id)
  }

  beforeDestroy (): void {
    this.$store.dispatch('sharedDimension/reset')
  }

  deleteDimension (dimension: SharedDimension): void {
    this.$buefy.dialog.confirm({
      title: dimension.actions.delete?.title,
      message: 'Are you sure you want to delete this shared dimension?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: async () => {
        await this.$store.dispatch('api/invokeDeleteOperation', {
          operation: dimension.actions.delete,
          successMessage: `Dimension ${dimension.name} deleted successfully`,
        })
        this.$router.push({ name: 'SharedDimensions' })
      },
    })
  }

  deleteTerm (term: SharedDimensionTerm): void {
    this.$buefy.dialog.confirm({
      title: term.actions.delete?.title,
      message: 'Are you sure you want to delete this term?',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
      onConfirm: () => {
        this.$store.dispatch('api/invokeDeleteOperation', {
          operation: term.actions.delete,
          successMessage: 'Term deleted successfully',
          callbackAction: 'sharedDimension/removeTerm',
          callbackParams: term,
        })
      },
    })
  }
}
</script>

<style scoped>
.table > thead > tr > * {
  vertical-align: middle;
}
</style>
