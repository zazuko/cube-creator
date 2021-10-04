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
import { Vue, Component, Prop } from 'vue-property-decorator'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdf-esm/dataset'
import { ReferenceColumnMapping, CsvSource, Table } from '@cube-creator/model'
import { cc } from '@cube-creator/core/namespace'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { ErrorDetails } from '@/api/errors'
import { Shape } from '@rdfine/shacl'
import * as storeNs from '../store/namespace'

@Component({
  components: { HydraOperationForm },
})
export default class extends Vue {
  @Prop({ required: true }) table!: Table
  @Prop({ required: true }) source!: CsvSource
  @Prop({ default: null }) columnMapping!: ReferenceColumnMapping
  @Prop({ required: true }) operation!: RuntimeOperation
  @Prop({ default: null }) error!: ErrorDetails | null
  @Prop({ default: false }) isSubmitting!: boolean
  @Prop() submitLabel?: string

  @storeNs.project.Getter('findTable') findTable!: (id: string) => Table
  @storeNs.project.Getter('findSource') findSource!: (id: string) => CsvSource
  @storeNs.project.Getter('tables') tables!: Table[]

  resource: GraphPointer = clownface({ dataset: $rdf.dataset() }).namedNode('').addOut(rdf.type, cc.LiteralColumnMapping)
  shape: Shape | null = null;

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
  }

  onSubmit (resource: GraphPointer): void {
    this.$emit('submit', resource)
  }
}
</script>
