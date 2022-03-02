<template>
  <hydra-operation-form
    :operation="operation"
    :resource="resource"
    :shape="shape"
    :error="error"
    :is-submitting="isSubmitting"
    :submit-label="submitLabel"
    @submit="onSubmit"
    @cancel="$emit('cancel')"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdf-esm/dataset'
import { mapGetters } from 'vuex'
import { ReferenceColumnMapping, CsvSource, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { ErrorDetails } from '@/api/errors'
import { Shape } from '@rdfine/shacl'

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

  data (): { resource: GraphPointer, shape: Shape | null } {
    return {
      resource: clownface({ dataset: $rdf.dataset() }).namedNode('').addOut(rdf.type, cc.LiteralColumnMapping),
      shape: null,
    }
  },

  async mounted (): Promise<void> {
    if (!this.operation) return

    const shape = await api.fetchOperationShape(this.operation)

    // Populate Column selector
    if (shape && this.source) {
      const source = this.source
      if (source) {
        source.columns.forEach((column) => {
          shape.pointer.node(column.id)
            .addOut(schema.name, column.name)
            .addOut(rdf.type, column.pointer.out(rdf.type))
        })
      }
    }

    this.shape = shape

    if (this.columnMapping) {
      this.resource = this.columnMapping.pointer
    }
  },

  computed: {
    ...mapGetters({
      findTable: 'project/findTable',
      findSource: 'project/findSource',
      tables: 'project/tables',
    }),
  },

  methods: {
    onSubmit (resource: GraphPointer): void {
      this.$emit('submit', resource)
    },
  },
})
</script>
