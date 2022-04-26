<template>
  <o-tabs type="boxed" v-model="sourceKind">
    <o-tab-item label="Upload" :value="MediaLocal">
      <file-upload
        :file-meta="fileMeta"
        :after-upload="submitLocal"
        @done="close"
      />
    </o-tab-item>
    <o-tab-item label="URL" :value="MediaURL">
      <form @submit.prevent="submitUrl">
        <o-field label="URL">
          <o-input :model-value="fileUrl" type="url" required />
        </o-field>
        <button-loading native-type="submit" variant="primary" :loading="isLoading">
          Upload
        </button-loading>
      </form>
    </o-tab-item>
  </o-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

import * as $rdf from '@rdfjs/dataset'
import { schema } from '@tpluscode/rdf-ns-builders'
import clownface from 'clownface'
import { CsvSource } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import ButtonLoading from './ButtonLoading.vue'
import FileUpload, { UploadedFile } from './FileUpload.vue'

export default defineComponent({
  name: 'CsvUploadForm',
  components: { ButtonLoading, FileUpload },
  props: {
    fileMeta: {
      type: Object as PropType<Record<string, unknown>>,
      default: undefined,
    },
    allowMultiple: {
      type: Boolean,
      default: true,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    source: {
      type: Object as PropType<CsvSource>,
      default: undefined,
    }
  },
  emits: ['submit', 'close'],

  data () {
    const MediaLocal = cc.MediaLocal.value
    const MediaURL = cc.MediaURL.value

    return {
      MediaLocal,
      MediaURL,
      sourceKind: MediaLocal,
      fileUrl: '',
    }
  },

  mounted () {
    const sourceMedia = this.source?.associatedMedia

    if (sourceMedia) {
      this.sourceKind = sourceMedia.sourceKind.value
    }

    if (sourceMedia?.contentUrl) {
      this.fileUrl = sourceMedia.contentUrl.value
    }
  },

  methods: {
    submitLocal (files: UploadedFile[]): void {
      const mediaObjects = files.map((file) =>
        clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('') })
          .addOut(cc.sourceKind, cc.MediaLocal)
          .addOut(schema.name, $rdf.literal(file.name))
          .addOut(schema.identifier, $rdf.literal(file.s3Multipart.key))
      )

      this.$emit('submit', mediaObjects)
    },

    submitUrl (): void {
      const dataset = $rdf.dataset()
      const fileName = this.fileUrl.split('/').slice(-1)[0]
      const mediaObject = clownface({ dataset, term: $rdf.namedNode('') })
        .addOut(cc.sourceKind, cc.MediaURL)
        .addOut(schema.name, $rdf.literal(fileName))
        .addOut(schema.contentUrl, $rdf.namedNode(this.fileUrl))

      this.$emit('submit', [mediaObject])
    },

    close (): void {
      this.$emit('close')
    },
  },
})
</script>
