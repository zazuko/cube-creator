<template>
  <side-pane :title="operation.title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Update CSV settings"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { GraphPointer } from 'clownface'
import { RuntimeOperation } from 'alcaeus'
import type { Shape } from '@rdfine/shacl'
import { CsvSource } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { displayToast } from '@/use-toast'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'CubeProjectEditView',
  components: { SidePane, HydraOperationForm },

  data (): {
    resource: GraphPointer | null,
    error: ErrorDetails | null,
    isSubmitting: boolean,
    shape: Shape | null,
    } {
    return {
      resource: null,
      error: null,
      isSubmitting: false,
      shape: null,
    }
  },

  async mounted (): Promise<void> {
    this.resource = Object.freeze(this.source.pointer)

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  },

  computed: {
    ...mapState('project', {
      project: 'project',
    }),
    ...mapGetters('project', {
      findSource: 'findSource',
    }),

    source (): CsvSource {
      const sourceId = this.$route.params.sourceId
      return this.findSource(sourceId)
    },

    operation (): RuntimeOperation | null {
      if (!this.source) return null

      return this.source.actions.edit
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        this.$store.dispatch('project/refreshSourcesCollection')

        displayToast(this, {
          message: 'Settings successfully saved',
          variant: 'success',
        })

        this.$router.push({ name: 'CSVMapping' })
      } catch (e) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    onCancel (): void {
      this.$router.push({ name: 'CSVMapping' })
    },
  },
})
</script>
