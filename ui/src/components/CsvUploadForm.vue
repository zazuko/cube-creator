<template>
  <b-tabs type="is-boxed" v-model="sourceKind">
    <b-tab-item label="Upload" value="MediaLocal">
      <file-upload
        :file-meta="fileMeta"
        :after-upload="submitLocal"
        @done="close"
      />
    </b-tab-item>
    <b-tab-item label="URL" value="MediaURL">
      <form @submit.prevent="submitUrl">
        <b-field label="URL">
          <b-input v-model="fileUrl" type="url" required />
        </b-field>
        <b-button native-type="submit" type="is-primary" :loading="isLoading">
          Upload
        </b-button>
      </form>
    </b-tab-item>
    <b-tab-item label="S3" value="MediaExternalS3" disabled>
      TODO
    </b-tab-item>
  </b-tabs>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import * as $rdf from '@rdfjs/dataset'
import { schema } from '@tpluscode/rdf-ns-builders'
import clownface from 'clownface'

import { cc } from '@cube-creator/core/namespace'
import FileUpload, { UploadedFile } from '@/components/FileUpload.vue'

@Component({
  components: { FileUpload },
})
export default class CsvUploadForm extends Vue {
  @Prop() fileMeta: any
  @Prop({ default: true }) allowMultiple!: boolean
  @Prop({ default: false }) isLoading!: boolean

  sourceKind = 'MediaLocal'
  fileUrl = ''

  submitLocal (files: UploadedFile[]): void {
    const mediaObjects = files.map((file) =>
      clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('') })
        .addOut(cc.sourceKind, cc.MediaLocal)
        .addOut(schema.name, $rdf.literal(file.name))
        .addOut(schema.identifier, $rdf.literal(file.s3Multipart.key))
        .addOut(schema.contentUrl, $rdf.namedNode(file.uploadURL))
    )

    this.$emit('submit', mediaObjects)
  }

  submitUrl (): void {
    const dataset = $rdf.dataset()
    const fileName = this.fileUrl.split('/').slice(-1)[0]
    const mediaObject = clownface({ dataset, term: $rdf.namedNode('') })
      .addOut(cc.sourceKind, cc.MediaURL)
      .addOut(schema.name, $rdf.literal(fileName))
      .addOut(schema.contentUrl, $rdf.namedNode(this.fileUrl))

    this.$emit('submit', [mediaObject])
  }

  close (): void {
    this.$emit('close')
  }
}
</script>
