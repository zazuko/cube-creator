<template>
  <button-loading
    v-if="resource"
    :size="size"
    :variant="variant"
    icon-left="download"
    @click="download"
    :loading="loading"
  >
    {{ title }}
  </button-loading>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { parse } from '@tinyhttp/content-disposition'
import { prepareHeaders } from '@/api'
import store from '@/store'
import { Resource } from 'alcaeus'
import ButtonLoading from './ButtonLoading.vue'

export default defineComponent({
  name: 'DownloadButton',
  components: { ButtonLoading },
  props: {
    resource: {
      type: Object as PropType<Resource>,
      default: undefined,
    },
    variant: {
      type: String as PropType<ColorsModifiers>,
      default: 'default',
    },
    size: {
      type: String,
      default: 'normal',
    },
  },

  data () {
    return {
      loading: false,
    }
  },

  computed: {
    title (): string {
      const [operation] = this.resource?.findOperations({
        byMethod: 'GET'
      }) || []

      return operation?.title || 'Download'
    },
  },

  methods: {
    async download (): Promise<void> {
      if (!this.resource) return

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
          anchor.download = parse(contentDisposition).parameters.filename as string
        }
        anchor.click()

        window.URL.revokeObjectURL(objectUrl)
      } finally {
        this.loading = false
        anchor.remove()
      }
    },
  },
})
</script>
