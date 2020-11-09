<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <cc-form :resource.prop="resource" :shapes.prop="shapePointer" no-editor-switches />

      <b-field>
        <button type="submit" class="button is-primary">
          Save
        </button>
        <b-button @click="onCancel">
          Cancel
        </b-button>
      </b-field>
    </form>
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
import { api } from '@/api'
import { APIErrorValidation } from '@/api/errors'

const projectNS = namespace('project')

@Component({
  components: { SidePane },
})
export default class CubeProjectEditView extends Vue {
  @projectNS.State('project') project!: Project
  @projectNS.Getter('findSource') findSource!: (id: string) => Source

  resource: GraphPointer | null = null;
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

  get shapePointer (): GraphPointer | null {
    return this.shape?.pointer ?? null
  }

  async mounted (): Promise<void> {
    this.resource = Object.freeze(this.source.pointer)

    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  async onSubmit (): Promise<void> {
    this.error = null
    const loader = this.$buefy.loading.open({})

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
      loader.close()
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
