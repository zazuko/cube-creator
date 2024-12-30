<template>
  <page-content class="container-narrow">
    <div class="mb-4 is-flex is-align-items-center">
      <h2 class="title is-size-4 mb-0">
        Shared Dimensions
      </h2>
      <div class="is-flex-grow-1" />
      <div v-if="collection">
        <hydra-operation-button
          :operation="collection.actions.create"
          :to="{ name: 'SharedDimensionCreate' }"
          variant="default"
          size="normal"
          :label="collection.actions.create.title"
        />
      </div>
      <language-select
        style="margin-left: 15px;"
        :selected-language="selectedLanguage"
        @language-selected="selectLanguage"
      />
    </div>
    <div v-if="collection">
      <div class="panel-block is-flex is-justify-content-center">
        <cc-hydra-operation-form
          inline clearable
          :operation.prop="operation"
          :resource.prop="searchParams"
          :shape.prop="shape"
          @submit="onSearch"
          submit-when-cleared
        />
      </div>
      <div v-if="dimensions.length > 0" class="panel">
        <router-link
          v-for="dimension in dimensions"
          :key="dimension.id.value"
          :to="{ name: 'SharedDimension', params: { id: dimension.clientPath } }"
          class="panel-block"
        >
          <div class="is-flex-grow-1 is-flex is-justify-content-space-between is-flex-direction-column">
            <div class="has-text-weight-bold">
              <term-with-language :values="dimension.names" :selected-language="selectedLanguage">
                <i> &lt;{{ dimension.id.value }}&gt; </i> <small>(No translation for {{ selectedLanguage }})</small>
              </term-with-language>
            </div>
            <p class="abbreviations is-size-7">
              <term-with-language :values="dimension.abbreviation" :selected-language="selectedLanguage">
                <span />
              </term-with-language>
            </p>
          </div>
          <shared-dimension-tags :dimension="dimension" />
        </router-link>
        <o-pagination
          simple
          :current="page"
          :total="collection.totalItems"
          :per-page="pageSize"
          @change="fetchPage"
        />
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
import { defineComponent, shallowRef } from 'vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import SharedDimensionTags from '@/components/SharedDimensionTags.vue'
import { mapGetters, mapState } from 'vuex'
import LanguageSelect from '@/components/LanguageSelect.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'
import { SharedDimension } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { getRouteSearchParamsFromTemplatedOperation } from '@/router'
import { hydra } from '@tpluscode/rdf-ns-builders'

export default defineComponent({
  name: 'CubeProjectsView',
  components: {
    TermWithLanguage,
    PageContent,
    LoadingBlock,
    HydraOperationButton,
    SharedDimensionTags,
    LanguageSelect,
  },

  async mounted (): Promise<void> {
    await this.$store.dispatch('sharedDimensions/fetchEntrypoint')
    await this.$store.dispatch('sharedDimensions/fetchCollection')

    this.operation = this.collection.actions.get
    this.searchParams = this.collection.searchParams
    this.pageSize = this.searchParams.out(hydra.limit).value
    this.page = parseInt(this.$router.currentRoute.value.query.page) || 1
  },

  setup () {
    const operation = shallowRef()

    const form = useHydraForm(operation)

    return {
      ...form,
      page: 1,
      pageSize: 0,
      searchParams: shallowRef()
    }
  },

  computed: {
    ...mapState('app', [
      'selectedLanguage',
    ]),
    ...mapState('sharedDimensions', {
      collection: 'collection',
    }),
    ...mapGetters('sharedDimensions', {
      dimensions: 'dimensions',
    }),
  },

  async beforeRouteUpdate (to) {
    await this.$store.dispatch('sharedDimensions/fetchCollection', to.query)
    this.searchParams = this.collection.searchParams
    this.pageSize = this.searchParams.out(hydra.limit).value
    this.page = parseInt(to.query.page) || 1
  },

  methods: {
    selectLanguage (language: string): void {
      this.$store.dispatch('app/selectLanguage', language)
    },

    onSearch (e: CustomEvent) {
      if (this.operation && e.detail?.value) {
        this.page = 1
        const query = {
          ...getRouteSearchParamsFromTemplatedOperation(this.operation, e.detail?.value),
          page: 1
        }
        this.$router.push({ query })
      }
    },

    nextPage () {
      this.fetchPage(this.page + 1)
    },

    prevPage () {
      this.fetchPage(this.page - 1)
    },

    fetchPage (page: number) {
      if (this.operation) {
        this.page = page
        const query = {
          ...getRouteSearchParamsFromTemplatedOperation(this.operation, this.searchParams),
          page
        }

        this.$router.push({ query, })
      }
    },
  }
})
</script>

<style scoped>
.abbreviations span {
  margin-right: 20px
}

cc-hydra-operation-form {
  width: 100%;
}
</style>
