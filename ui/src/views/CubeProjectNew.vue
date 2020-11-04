<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>
    <form @submit.prevent="onSubmit">
      <cc-form :resource.prop="resource" :shapes.prop="shapes" no-editor-switches />
      <form-submit-cancel submit-label="Create project" @cancel="onCancel" />
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import clownface, { GraphPointer } from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import { sh } from '@tpluscode/rdf-ns-builders'
import { RuntimeOperation, RdfResource } from 'alcaeus'

@Component({
  components: { SidePane, FormSubmitCancel },
})
export default class CubeProjectNewView extends Vue {
  @State((state) => state.projects.collection.actions.create)
  operation!: RuntimeOperation | null;

  resource: GraphPointer | null = Object.freeze(clownface({ dataset: dataset() }).namedNode(''));
  error: string | null = null;
  shapes: GraphPointer | null = null;

  get title (): string {
    return this.operation?.title ?? ''
  }

  async mounted (): Promise<void> {
    const expects: RdfResource | undefined = this.operation?.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    if (expects && expects.load) {
      const { representation } = await expects.load()
      if (representation && representation.root) {
        const shape = representation.root
        this.shapes = shape.pointer
      }
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
