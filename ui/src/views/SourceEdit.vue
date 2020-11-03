<template>
  <side-pane :is-open="true" :title="operation.title" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <cc-form :resource.prop="resource" :shapes.prop="shapes" no-editor-switches />

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
import { RuntimeOperation, RdfResource } from 'alcaeus'
import { sh } from '@tpluscode/rdf-ns-builders'
import { Project, Source } from '../types'
import SidePane from '@/components/SidePane.vue'
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
  shapes: GraphPointer | null = null;

  get source (): Source {
    const sourceId = this.$router.currentRoute.params.sourceId
    return this.findSource(sourceId)
  }

  get operation (): RuntimeOperation | null {
    if (!this.source) return null

    return this.source.actions.edit
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

    this.resource = Object.freeze(this.source.pointer)
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
