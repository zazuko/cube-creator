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
      :submit-button-type="submitButtonType"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import type { Shape } from '@rdfine/shacl'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'

@Component({
  components: { HydraOperationForm },
})
export default class JobForm extends Vue {
  @Prop() operation!: RuntimeOperation
  @Prop() submitButtonType?: string
  @Prop({ default: false }) confirm!: boolean
  @Prop({ default: 'Are you sure?' }) confirmationMessage!: string

  resource: GraphPointer = Object.freeze(clownface({ dataset: dataset() }).namedNode('').addOut(rdf.type, this.resourceType))
  shape: Shape | null = null
  error: ErrorDetails | null = null
  isSubmitting = false

  get resourceType (): NamedNode {
    const type = this.operation.expects.find((expect) => !expect.types.has(sh.Shape))

    if (!type) throw new Error('Operation expected type not found')

    return type.id as NamedNode
  }

  async mounted (): Promise<void> {
    this.shape = await api.fetchOperationShape(this.operation)
  }

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

      this.$buefy.toast.open({
        message: `${job.name} was started`,
        type: 'is-success',
      })

      this.$store.dispatch('project/fetchJobCollection')
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }

  async askConfirmation (): Promise<boolean> {
    return new Promise((resolve) => {
      this.$buefy.dialog.confirm({
        title: this.operation.title,
        message: this.confirmationMessage,
        confirmText: 'Confirm',
        type: 'is-danger',
        hasIcon: true,
        onConfirm () {
          resolve(true)
        },
        onCancel () {
          resolve(false)
        },
      })
    })
  }
}
</script>
