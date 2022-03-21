<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Create project"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, ShallowRef } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import type { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'CubeProjectCreateView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const resource: ShallowRef<GraphPointer | null> = shallowRef(clownface({ dataset: dataset() }).namedNode(''))
    const error: ShallowRef<ErrorDetails | null> = shallowRef(null)
    const isSubmitting = ref(false)
    const shape: ShallowRef<Shape | null> = shallowRef(null)
    const shapes: ShallowRef<GraphPointer | null> = shallowRef(null)

    return {
      resource,
      error,
      isSubmitting,
      shape,
      shapes,
    }
  },

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  },

  computed: {
    operation (): RuntimeOperation | null {
      return this.$store.state.projects.collection?.actions.create ?? null
    },

    title (): string {
      return this.operation?.title ?? ''
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      this.error = null
      this.isSubmitting = true

      try {
        const project = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        displayToast({
          message: `Project ${project.title} successfully created`,
          variant: 'success',
        })

        this.$router.push({ name: 'CubeProject', params: { id: project.clientPath } })
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
      this.$router.push({ name: 'CubeProjects' })
    },
  },
})
</script>
