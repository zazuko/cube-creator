<template>
  <uppy-dashboard v-if="uppy" :uppy="uppy" :props="uppyDashboardOptions" />
  <loading-block v-else />
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import AwsS3Multipart from '@uppy/aws-s3-multipart'
import Uppy, { UppyFile } from '@uppy/core'
import { Dashboard as UppyDashboard } from '@uppy/vue'
import { prepareHeaders } from '@/api'
import LoadingBlock from './LoadingBlock.vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const apiURL = window.APP_CONFIG.apiCoreBase
// Maybe provide this URL in the Hydra API at some point
const uploadURL = `${apiURL}upload`

export interface UploadedFile extends UppyFile {
  uploadURL: string
  s3Multipart: {
    key: string
  }
}

@Component({
  components: { LoadingBlock, UppyDashboard },
})
export default class extends Vue {
  @Prop() afterUpload: any
  @Prop() fileMeta: any
  @Prop({ default: true }) allowMultiple!: boolean

  uppy: Uppy.Uppy<Uppy.StrictTypes> | null = null
  uppyDashboardOptions = {
    proudlyDisplayPoweredByUppy: false,
    showLinkToFileUploadResult: false,
    note: 'CSV files only',
    doneButtonHandler: this.onDone,
  }

  mounted (): void {
    const uppy = Uppy<Uppy.StrictTypes>({
      restrictions: {
        allowedFileTypes: ['.csv'],
        maxNumberOfFiles: this.allowMultiple ? null : 1,
      },
      meta: this.fileMeta,
    })

    uppy.use(AwsS3Multipart, { companionUrl: uploadURL })
    uppy.addPreProcessor(async () => {
      // Hack to set fresh auth token before each upload
      const headers = prepareHeaders(uploadURL, this.$store)
      const plugin = uppy.getPlugin('AwsS3Multipart') as any
      plugin.client.opts.companionHeaders = headers
    })
    uppy.addPostProcessor(this.onUploaded)

    this.uppy = uppy
  }

  beforeDestroy (): void {
    this.uppy?.close()
  }

  onUploaded (fileIds: string[]): Promise<void> {
    const files = fileIds.map(id => toUploadedFile(this.uppy?.getFile(id)))

    return this.afterUpload(files)
  }

  onDone (): void {
    this.$emit('done')
  }
}

function toUploadedFile (file: UppyFile | undefined): UploadedFile {
  if (!file) throw new Error('File not found')

  if (!('uploadURL' in file)) throw new Error('Missing uploadURL')

  if (!('s3Multipart' in file)) throw new Error('Missing s3Multipart')

  return file
}
</script>
