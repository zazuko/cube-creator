<template>
  <side-pane :title="operation.title" @close="close">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>

    <o-field>
      <p>
        You can upload a new CSV file to replace <em>{{ source.name }}</em>.
      </p>
    </o-field>

    <b-message type="is-info">
      <ul class="list-disc list-inside">
        <li>Columns must have the same names as the original CSV file.</li>
        <li>New columns can be added.</li>
      </ul>
    </b-message>

    <csv-upload-form
      :allow-multiple="false"
      :file-meta="fileMeta"
      :is-loading="isLoading"
      @submit="submit"
      @close="close"
    />
  </side-pane>
</template>

<script lang="ts">
import RdfResourceImpl from '@tpluscode/rdfine'
import { RuntimeOperation } from 'alcaeus'
import { Component, Vue } from 'vue-property-decorator'
import { GraphPointer } from 'clownface'

import { CsvMapping, CsvSource } from '@cube-creator/model'

import { api } from '@/api'
import CsvUploadForm from '@/components/CsvUploadForm.vue'
import SidePane from '@/components/SidePane.vue'
import BMessage from '@/components/BMessage.vue'
import * as storeNs from '../store/namespace'
import { displayToast } from '@/use-toast'

@Component({
  components: { BMessage, CsvUploadForm, SidePane },
})
export default class CSVReplaceView extends Vue {
  @storeNs.project.State('csvMapping') mapping!: CsvMapping
  @storeNs.project.Getter('findSource') findSource!: (id: string) => CsvSource

  error: string | null = null
  isLoading = false

  get source (): CsvSource {
    const sourceId = this.$route.params.sourceId
    return this.findSource(sourceId)
  }

  get operation (): RuntimeOperation {
    const operation = this.source.actions.replace

    if (!operation) throw new Error('Missing replace operation')

    return operation
  }

  get fileMeta (): Record<string, string> {
    return {
      csvMapping: this.mapping.id.value,
      replace: this.source.id.value,
    }
  }

  async submit (mediaObjects: GraphPointer[]): Promise<void> {
    const mediaObject = mediaObjects[0]

    const operation = this.operation
    const resource = RdfResourceImpl.factory.createEntity(mediaObject)

    this.error = null
    this.isLoading = true

    try {
      await api.invokeSaveOperation(operation, resource)

      displayToast(this, {
        message: 'CSV file was successfully replaced',
        variant: 'success',
      })

      await this.close()
    } catch (e) {
      this.error = e?.details?.detail ?? e.toString()
      throw e
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
