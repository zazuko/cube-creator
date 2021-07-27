<template>
  <side-pane :title="operation.title" @close="close">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <file-upload
        :file-meta="fileMeta"
        :after-upload="createSources"
        @done="close"
      />
    </form>
  </side-pane>
</template>

<script lang="ts">
import * as $rdf from '@rdfjs/dataset'
import RdfResourceImpl from '@tpluscode/rdfine'
import { schema } from '@tpluscode/rdf-ns-builders'
import { RuntimeOperation } from 'alcaeus'
import clownface from 'clownface'
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

import { CsvMapping } from '@cube-creator/model'

import { api } from '@/api'
import FileUpload, { UploadedFile } from '@/components/FileUpload.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import SidePane from '@/components/SidePane.vue'

const projectNS = namespace('project')

@Component({
  components: { FileUpload, SidePane, FormSubmitCancel },
})
export default class CSVUploadView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping

  error: string | null = null

  get fileMeta (): Record<string, string> {
    return { csvMapping: this.mapping.id.value }
  }

  get operation (): RuntimeOperation {
    const operation = this.mapping.sourcesCollection.actions?.create

    if (!operation) throw new Error('Missing create operation')

    return operation
  }

  async createSources (files: UploadedFile[]): Promise<void> {
    const operation = this.operation
    const uploads = files.map((file) => {
      const dataset = $rdf.dataset()
      const pointer = clownface({ dataset, term: $rdf.namedNode('') })
        .addOut(schema.name, $rdf.literal(file.name))
        .addOut(schema.identifier, $rdf.literal(file.s3Multipart.key))
        .addOut(schema.contentUrl, $rdf.namedNode(file.uploadURL))
      const resource = RdfResourceImpl.factory.createEntity(pointer)

      return api.invokeSaveOperation(operation, resource)
    })

    this.error = null

    try {
      await Promise.all(uploads)
    } catch (e) {
      this.error = e.toString()
      throw e
    }
  }

  async close (): Promise<void> {
    await this.$store.dispatch('project/refreshSourcesCollection')
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
