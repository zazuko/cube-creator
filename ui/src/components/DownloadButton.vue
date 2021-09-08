<template>
  <b-button type="is-link is-light" icon-left="download" @click="download" :loading="loading">
    {{ title }}
  </b-button>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { prepareHeaders } from '@/api'
import { parse } from '@tinyhttp/content-disposition/dist/index.js'
import store from '@/store'
import { Resource } from 'alcaeus'

@Component
export default class DownloadButton extends Vue {
  @Prop({ required: true }) resource!: Resource

  loading = false

  get title (): string {
    const [operation] = this.resource.findOperations({
      byMethod: 'GET'
    })

    return operation?.title || 'Download'
  }

  async download (): Promise<void> {
    const anchor = document.createElement('a')
    document.body.appendChild(anchor)

    try {
      this.loading = true
      const response = await fetch(this.resource.id.value, {
        headers: prepareHeaders(this.resource.id.value, store)
      })
      const objectUrl = window.URL.createObjectURL(await response.blob())
      const contentDisposition = response.headers.get('Content-Disposition')

      anchor.href = objectUrl
      if (contentDisposition) {
        anchor.download = parse(contentDisposition).parameters.filename
      }
      anchor.click()

      window.URL.revokeObjectURL(objectUrl)
    } finally {
      this.loading = false
      anchor.remove()
    }
  }
}
</script>
