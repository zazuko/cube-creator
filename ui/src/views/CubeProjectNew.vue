<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <b-message v-if="error" type="is-danger">
      {{ error }}
    </b-message>
    <form @submit.prevent="onSubmit">
      <cc-form :resource.prop="resource" :shapes.prop="shapes" no-editor-switches />
      <b-field>
        <button type="submit" class="button is-primary">
          Create project
        </button>
        <b-button @click="onCancel">
          Cancel
        </b-button>
      </b-field>
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import clownface, { GraphPointer } from 'clownface'
import { dataset } from '@rdf-esm/dataset'
import SidePane from '@/components/SidePane.vue'
import { sh } from '@tpluscode/rdf-ns-builders'
import { RuntimeOperation, RdfResource } from 'alcaeus'

@Component({
  components: { SidePane },
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

    try {
      const project = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: this.operation,
        resource: this.resource,
      })
      this.$router.push({ name: 'CubeProject', params: { id: project.clientPath } })
    } catch (e) {
      console.error(e)
      // TODO: Improve error display
      this.error = e
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeProjects' })
  }
}
</script>
