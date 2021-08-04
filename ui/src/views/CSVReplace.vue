<template>
  <side-pane :title="operation.title" @close="close">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>

    <b-field>
      <p>
        You can upload a new CSV file to replace <em>{{ source.name }}</em>.
      </p>
    </b-field>

    <b-message type="is-info">
      <ul class="list-disc list-inside">
        <li>Columns must have the same names as the original CSV file.</li>
        <li>New columns can be added.</li>
      </ul>
    </b-message>

    <file-upload
      :file-meta="fileMeta"
      :after-upload="replaceFile"
      :allow-multiple="false"
      @done="close"
    />
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

import { CsvMapping, CsvSource } from '@cube-creator/model'

import { api } from '@/api'
import FileUpload, { UploadedFile } from '@/components/FileUpload.vue'
import SidePane from '@/components/SidePane.vue'

const projectNS = namespace('project')

@Component({
  components: { SidePane, FileUpload },
})
export default class CSVUploadView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping
  @projectNS.Getter('findSource') findSource!: (id: string) => CsvSource

  error: string | null = null

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

  async replaceFile (file: UploadedFile): Promise<void> {
    const operation = this.operation
    const dataset = $rdf.dataset()
    const pointer = clownface({ dataset, term: $rdf.namedNode('') })
      .addOut(schema.name, $rdf.literal(file.name))
      .addOut(schema.identifier, $rdf.literal(file.s3Multipart.key))
      .addOut(schema.contentUrl, $rdf.namedNode(file.uploadURL))
    const resource = RdfResourceImpl.factory.createEntity(pointer)

    this.error = null

    try {
      await api.invokeSaveOperation(operation, resource)

      this.$buefy.toast.open({
        message: 'CSV file was successfully replaced',
        type: 'is-success',
      })

      await this.close()
    } catch (e) {
      this.error = e?.details?.detail ?? e.toString()
      throw e
    }
  }

  async close (): Promise<void> {
    await this.$store.dispatch('project/refreshSourcesCollection')
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
