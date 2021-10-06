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
      <table class="table is-narrow is-bordered is-striped is-fullwidth" v-if="terms">
        <thead>
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
          <tr v-for="term in terms" :key="term.clientPath">
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
          <tr v-if="terms.length === 0">
            <td colspan="3">
              Nothing in this dimension yet.
              <span v-if="dimension.actions.create">
                Do you want to
                <router-link :to="{ name: 'SharedDimensionTermCreate' }">
                  add a term
                </router-link>?
              </span>
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

  mounted (): void {
    const id = this.$route.params.id
    this.$store.dispatch('sharedDimension/fetchDimension', id)
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
