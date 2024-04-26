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
import { defineComponent } from 'vue'
import RdfResourceImpl from '@tpluscode/rdfine'
import { RuntimeOperation } from 'alcaeus'
import type { GraphPointer } from 'clownface'

import { api } from '@/api'
import BMessage from '@/components/BMessage.vue'
import CsvUploadForm from '@/components/CsvUploadForm.vue'
import SidePane from '@/components/SidePane.vue'
import { displayToast } from '@/use-toast'
import { mapState } from 'vuex'

export default defineComponent({
  name: 'CSVUploadView',
  components: { BMessage, CsvUploadForm, SidePane },

  data (): { isLoading: boolean, error: string | null } {
    return {
      isLoading: false,
      error: null,
    }
  },

  computed: {
    ...mapState('project', {
      mapping: 'csvMapping',
    }),

    fileMeta (): Record<string, string> {
      return { csvMapping: this.mapping.id.value }
    },

    operation (): RuntimeOperation {
      const operation = this.mapping.sourcesCollection.actions?.create

      if (!operation) throw new Error('Missing create operation')

      return operation
    },
  },

  methods: {
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

        displayToast({
          message: 'CSV files were successfully uploaded',
          variant: 'success',
        })

        await this.close()
      } catch (e: any) {
        this.error = e?.details?.detail ?? e.toString()
      } finally {
        this.isLoading = false
      }
    },

    async close (): Promise<void> {
      await this.$store.dispatch('project/refreshSourcesCollection')
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
