<template>
  <hydra-operation-form
    :operation="operation"
    :resource="resource"
    :shape="shape"
    :error="error"
    :is-submitting="isSubmitting"
    :submit-label="submitLabel"
    @submit="$emit('submit', $event)"
    @cancel="$emit('cancel')"
  />
</template>

<script lang="ts">
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { RuntimeOperation } from 'alcaeus'
import { defineComponent, PropType, toRefs, watch } from 'vue'

import { cc } from '@cube-creator/core/namespace'
import { ReferenceColumnMapping, CsvSource, Table } from '@cube-creator/model'

import { ErrorDetails } from '@/api/errors'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { useHydraForm } from '@/use-hydra-form'

export default defineComponent({
  name: 'LiteralColumnMappingForm',
  components: { HydraOperationForm },
  props: {
    table: {
      type: Object as PropType<Table>,
      required: true,
    },
    source: {
      type: Object as PropType<CsvSource>,
      required: true
    },
    columnMapping: {
      type: Object as PropType<ReferenceColumnMapping | null>,
      default: null,
    },
    operation: {
      type: Object as PropType<RuntimeOperation>,
      required: true,
    },
    error: {
      type: Object as PropType<ErrorDetails | null>,
      default: null,
    },
    isSubmitting: {
      type: Boolean,
      default: false,
    },
    submitLabel: {
      type: String,
      default: undefined,
    },
  },
  emits: ['submit', 'cancel'],

  setup (props) {
    const { columnMapping, operation, source } = toRefs(props)

    const form = useHydraForm(operation)

    form.resource.value?.addOut(rdf.type, cc.LiteralColumnMapping)

    watch(form.shape, (shape) => {
      // Populate Column selector
      if (shape && source.value) {
        source.value.columns.forEach((column) => {
          shape.pointer.node(column.id)
            .addOut(schema.name, column.name)
            .addOut(rdf.type, column.pointer.out(rdf.type))
        })
      }

      if (columnMapping.value) {
        form.resource.value = columnMapping.value.pointer
      }
    })

    return {
      shape: form.shape,
      resource: form.resource,
    }
  },
})
</script>
