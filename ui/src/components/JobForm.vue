<template>
  <div>
    <p>
      {{ operation.description }}
    </p>
    <hydra-operation-form
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @submit="onSubmit"
      :show-cancel="false"
      :submit-button-variant="submitButtonVariant"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import type { Shape } from '@rdfine/shacl'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import { displayToast } from '@/use-toast'
import { confirmDialog } from '@/use-dialog'

export default defineComponent({
  name: 'JobForm',
  components: { HydraOperationForm },
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    submitButtonVariant: {
      type: String,
      default: undefined,
    },
    confirm: {
      type: Boolean,
      default: false,
    },
    confirmationMessage: {
      type: String,
      default: 'Are you sure?',
    },
  },

  data (): { resource: GraphPointer | null, shape: Shape | null, error: ErrorDetails | null, isSubmitting: boolean } {
    return {
      resource: null,
      shape: null,
      error: null,
      isSubmitting: false,
    }
  },

  created () {
    this.resource = Object.freeze(clownface({ dataset: dataset() }).namedNode('').addOut(rdf.type, this.resourceType))
  },

  async mounted (): Promise<void> {
    this.shape = await api.fetchOperationShape(this.operation)
  },

  computed: {
    resourceType (): NamedNode {
      const type = this.operation.expects.find((expect) => !expect.types.has(sh.Shape))

      if (!type) throw new Error('Operation expected type not found')

      return type.id as NamedNode
    },
  },

  methods: {
    async onSubmit (resource: GraphPointer): Promise<void> {
      if (this.confirm) {
        const confirmation = await this.askConfirmation()
        if (!confirmation) return
      }

      this.error = null
      this.isSubmitting = true

      try {
        const job = await this.$store.dispatch('api/invokeSaveOperation', {
          operation: this.operation,
          resource,
        })

        displayToast(this, {
          message: `${job.name} was started`,
          variant: 'success',
        })

        this.$store.dispatch('project/fetchJobCollection')
      } catch (e: any) {
        this.error = e.details ?? { detail: e.toString() }

        if (!(e instanceof APIErrorValidation)) {
          console.error(e)
        }
      } finally {
        this.isSubmitting = false
      }
    },

    async askConfirmation (): Promise<boolean> {
      return new Promise((resolve) => {
        confirmDialog(this, {
          title: this.operation.title,
          message: this.confirmationMessage,
          confirmText: 'Confirm',
          onConfirm () {
            resolve(true)
          },
          onCancel () {
            resolve(false)
          },
        })
      })
    },
  },
})
</script>
