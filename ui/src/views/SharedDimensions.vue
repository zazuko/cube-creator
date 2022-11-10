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
        :selected-language="selectedLanguage"
        @language-selected="selectLanguage"
      />
    </div>
    <div v-if="collection">
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
                <i>No translation for {{ selectedLanguage }}</i>
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
import LanguageSelect from '@/components/LanguageSelect.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'

export default defineComponent({
  name: 'CubeProjectsView',
  components: {
    TermWithLanguage,
    PageContent,
    LoadingBlock,
    HydraOperationButton,
    SharedDimensionTags,
    LanguageSelect
  },

  async mounted (): Promise<void> {
    await this.$store.dispatch('sharedDimensions/fetchEntrypoint')
    await this.$store.dispatch('sharedDimensions/fetchCollection')
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

  methods: {
    selectLanguage (language: string): void {
      this.$store.dispatch('app/selectLanguage', language)
    },
  }
})
</script>

<style scoped>
.abbreviations span {
  margin-right: 20px
}

#language {
  margin-left: 20px;
}
</style>
