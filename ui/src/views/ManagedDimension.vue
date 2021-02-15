<template>
  <page-content>
    <div v-if="dimension">
      <h2 class="title is-size-4 mb-0">
        <term-with-language :values="dimension.name" :selected-language="language" />
      </h2>
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import TermWithLanguage from '@/components/TermWithLanguage.vue'

const appNS = namespace('app')
const managedDimensionNS = namespace('managedDimension')

interface ManagedDimension {
  name: string
}

@Component({
  components: { LoadingBlock, PageContent, TermWithLanguage },
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
