<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <hydra-operation-form
      v-if="operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import clownface, { GraphPointer } from 'clownface'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import { Project, Source } from '../types'
import SidePane from '@/components/SidePane.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { api } from '@/api'
import { APIErrorValidation } from '@/api/errors'

const projectNS = namespace('project')

@Component({
  components: { SidePane, HydraOperationForm },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.State('project') project!: Project
  @projectNS.Getter('findSource') findSource!: (id: string) => Source

  resource: GraphPointer | null = null;
  isSubmitting = false;
  error: string | null = null;
  shape: Shape | null = null;

  get source (): Source {
    const sourceId = this.$router.currentRoute.params.sourceId
    return this.findSource(sourceId)
  }

  get operation (): RuntimeOperation | null {
    if (!this.source) return null

    return this.source.actions.edit
  }

  async mounted (): Promise<void> {
    this.resource = Object.freeze(this.source.pointer)

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  async onSubmit (): Promise<void> {
    this.error = null
    this.isSubmitting = true

    try {
      await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('project/refreshSourcesCollection')

      this.$store.dispatch('app/showMessage', {
        message: 'Settings successfully saved',
        type: 'is-success',
      })

      this.$router.push({ name: 'CSVMapping' })
    } catch (e) {
      if (e instanceof APIErrorValidation) {
        this.error = e.details?.title ?? e.toString()
      } else {
        console.error(e)
        this.error = e.toString()
      }
    } finally {
      this.isSubmitting = false
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
