<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>
    <form @submit.prevent="onSubmit">
      <cc-form :resource.prop="resource" :shapes.prop="shapePointer" no-editor-switches />
      <form-submit-cancel submit-label="Create project" @cancel="onCancel" />
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { RuntimeOperation } from 'alcaeus'
import clownface, { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import { api } from '@/api'

@Component({
  components: { SidePane, FormSubmitCancel },
})
export default class CubeProjectNewView extends Vue {
  @State((state) => state.projects.collection.actions.create)
  operation!: RuntimeOperation | null;

  resource: GraphPointer | null = Object.freeze(clownface({ dataset: dataset() }).namedNode(''));
  error: string | null = null;
  shape: Shape | null = null;
  shapes: GraphPointer | null = null;

  get title (): string {
    return this.operation?.title ?? ''
  }

  get shapePointer (): GraphPointer | null {
    return this.shape?.pointer ?? null
  }

  async mounted (): Promise<void> {
    if (this.operation) {
      this.shape = await api.fetchOperationShape(this.operation)
    }
  }

  async onSubmit (): Promise<void> {
    this.error = null
    const loader = this.$buefy.loading.open({})

    try {
      const project = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })

      this.$store.dispatch('app/showMessage', {
        message: `Project ${project.title} successfully created`,
        type: 'is-success',
      })

      this.$router.push({ name: 'CubeProject', params: { id: project.clientPath } })
    } catch (e) {
      console.error(e)
      // TODO: Improve error display
      this.error = e
    } finally {
      loader.close()
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeProjects' })
  }
}
</script>
