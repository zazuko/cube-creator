<template>
  <side-pane :title="operation.title" @close="close">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>

    <csv-upload-form
      :is-loading="isLoading"
      :file-meta="fileMeta"
      @submit="submit"
      @close="close"
    />
  </side-pane>
</template>

<script lang="ts">
import RdfResourceImpl from '@tpluscode/rdfine'
import { RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

import { CsvMapping } from '@cube-creator/model'

import { api } from '@/api'
import CsvUploadForm from '@/components/CsvUploadForm.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import SidePane from '@/components/SidePane.vue'

const projectNS = namespace('project')

@Component({
  components: { CsvUploadForm, SidePane, FormSubmitCancel },
})
export default class CSVUploadView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping

  isLoading = false
  error: string | null = null

  get fileMeta (): Record<string, string> {
    return { csvMapping: this.mapping.id.value }
  }

  get operation (): RuntimeOperation {
    const operation = this.mapping.sourcesCollection.actions?.create

    if (!operation) throw new Error('Missing create operation')

    return operation
  }

  async submit (mediaObjects: GraphPointer[]): Promise<void> {
    const operation = this.operation
    const uploads = mediaObjects.map((mediaObject) => {
      const resource = RdfResourceImpl.factory.createEntity(mediaObject)

      return api.invokeSaveOperation(operation, resource)
    })

    this.error = null
    this.isLoading = true

    try {
      await Promise.all(uploads)

      this.$buefy.toast.open({
        message: 'CSV files were successfully uploaded',
        type: 'is-success',
      })

      await this.close()
    } catch (e) {
      this.error = e?.details?.detail ?? e.toString()
    } finally {
      this.isLoading = false
    }
  }

  async close (): Promise<void> {
    await this.$store.dispatch('project/refreshSourcesCollection')
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
