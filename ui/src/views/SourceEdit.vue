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
import { defineComponent, ref, shallowRef, ShallowRef } from 'vue'
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

  setup () {
    const resource: ShallowRef<GraphPointer | null> = shallowRef(null)
    const error: ShallowRef<ErrorDetails | null> = shallowRef(null)
    const isSubmitting = ref(false)
    const shape: ShallowRef<Shape | null> = shallowRef(null)

    return {
      resource,
      error,
      isSubmitting,
      shape,
    }
  },

  async mounted (): Promise<void> {
    this.resource = this.source.pointer

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

        displayToast({
          message: 'Settings successfully saved',
          variant: 'success',
        })

        this.$router.push({ name: 'CSVMapping' })
      } catch (e: any) {
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
