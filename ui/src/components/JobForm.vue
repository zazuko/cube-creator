<template>
  <div>
    <p>
      {{ operation.description }}
    </p>
    <cc-hydra-operation-form
      :operation.prop="operation"
      :resource.prop="resource"
      :shape.prop="shape"
      :error.prop="error"
      :submitting.prop="isSubmitting"
      @submit="e => onSubmit(e.detail.value)"
      :submit-button-variant="submitButtonVariant"
    />
  </div>
</template>

<script lang="ts">
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { RuntimeOperation } from 'alcaeus'
import { defineComponent, PropType, toRefs } from 'vue'
import { useStore } from 'vuex'
import '@/customElements/HydraOperationForm'
import { RootState } from '@/store/types'
import { confirmDialog } from '@/use-dialog'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'JobForm',
  props: {
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    submitButtonVariant: {
      type: String as PropType<ColorsModifiers>,
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

  setup (props) {
    const { operation, confirm, confirmationMessage } = toRefs(props)

    const store = useStore<RootState>()

    const askConfirmation = async () => {
      return new Promise((resolve) => {
        confirmDialog({
          title: operation.value.title,
          message: confirmationMessage.value,
          confirmText: 'Confirm',
          onConfirm () {
            resolve(true)
          },
          onCancel () {
            resolve(false)
          },
        })
      }) as Promise<boolean>
    }

    const form = useHydraForm(operation, {
      async beforeSubmit () {
        if (!confirm.value) return true

        return await askConfirmation()
      },

      afterSubmit (job: any) {
        displayToast({
          message: `${job.name} was started`,
          variant: 'success',
        })

        store.dispatch('project/fetchJobCollection')
      },
    })

    const resourceType = operation.value.expects.find((expect) => !expect.types.has(sh.Shape))
    if (resourceType) {
      form.resource.value?.addOut(rdf.type, resourceType.id)
    }

    return form
  },
})
</script>
