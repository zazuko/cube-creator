<template>
  <side-pane :title="title" @close="onCancel">
    <hydra-operation-form
      v-if="operation && resource"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @cancel="onCancel"
      @submit="onSubmit"
    />
  </side-pane>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, shallowRef, ShallowRef } from 'vue'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { GraphPointer } from 'clownface'
import { Dataset, DimensionMetadata } from '@cube-creator/model'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { serializeResource } from '../store/serializers'
import { displayToast } from '@/use-toast'
import { mapGetters } from 'vuex'

export default defineComponent({
  name: 'DimensionMappingView',
  components: { SidePane, HydraOperationForm },

  setup () {
    const mappings: Ref<RdfResource | null> = ref(null)
    const resource: Ref<GraphPointer | null> = ref(null)
    const error: ShallowRef<ErrorDetails | null> = shallowRef(null)
    const isSubmitting = ref(false)
    const shape: ShallowRef<Shape | null> = shallowRef(null)

    return {
      mappings,
      resource,
      error,
      isSubmitting,
      shape,
    }
  },

  async mounted (): Promise<void> {
    if (this.dimension.mappings) {
      const mappings = await api.fetchResource(this.dimension.mappings.value)
      this.mappings = serializeResource(mappings)
    }

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }

    this.resource = this.mappings?.pointer ?? null
  },

  computed: {
    ...mapGetters('project', {
      findDimension: 'findDimension',
    }),

    cubeMetadata (): Dataset | null {
      return this.$store.state.project.cubeMetadata
    },

    dimension (): DimensionMetadata {
      return this.findDimension(this.$route.params.dimensionId)
    },

    operation (): RuntimeOperation | null {
      return this.mappings?.actions.replace ?? null
    },

    title (): string {
      return this.operation?.title ?? 'Error: Missing operation'
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

        this.$store.dispatch('project/fetchDimensionMetadataCollection')

        displayToast({
          message: 'Mapping to shared dimension was saved',
          variant: 'success',
        })

        this.$router.push({ name: 'CubeDesigner' })
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
      this.$router.push({ name: 'CubeDesigner' })
    },
  },
})
</script>
