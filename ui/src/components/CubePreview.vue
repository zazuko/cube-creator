<template>
  <table class="table is-condensed is-bordered cube-preview">
    <thead>
      <tr>
        <th :colspan="dimensions.length || 1">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <term-with-language :values="cubeMetadata.title" :selected-language="selectedLanguage">
                  Missing cube title
                </term-with-language>
              </div>
              <div class="level-item">
                <hydra-operation-button :operation="cubeMetadata.actions.edit" :to="{ name: 'CubeMetadataEdit' }" />
              </div>
            </div>
            <div class="level-right">
              <b-select v-model="selectedLanguage" class="level-item">
                <option v-for="language in languages" :key="language" :value="language">
                  {{ language }}
                </option>
              </b-select>
            </div>
          </div>
        </th>
      </tr>
      <tr>
        <th v-for="dimension in dimensions" :key="dimension.id.value">
          <term-with-language :values="dimension.name" :selected-language="selectedLanguage">
            Missing dimension name
          </term-with-language>
          <hydra-operation-button
            :operation="dimension.actions.edit"
            :to="{ name: 'DimensionEdit', params: { dimensionId: dimension.clientPath } }"
          />
        </th>
        <th v-if="dimensions.length === 0" class="has-text-grey has-text-centered">
          No dimensions defined
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td :colspan="dimensions.length || 1">
          <p class="has-text-grey has-text-centered">
            Data will go here
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import type { Dataset, DimensionMetadata } from '@cube-creator/model'
import HydraOperationButton from './HydraOperationButton.vue'
import TermWithLanguage from './TermWithLanguage.vue'

const languages = ['en', 'fr', 'de', 'it']

@Component({
  components: { HydraOperationButton, TermWithLanguage },
})
export default class extends Vue {
  @Prop() cubeMetadata!: Dataset
  @Prop() dimensions!: DimensionMetadata[]

  languages = languages
  selectedLanguage = 'en'
}
</script>

<style scoped>
.cube-preview {
  min-width: 40rem;
}
</style>
