<template>
  <side-pane :is-open="true" :title="title" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <cc-form :resource.prop="cubeMetadata.pointer" :shapes.prop="shapes" />
      <form-submit-cancel submit-label="Save metadata" />
    </form>
  </side-pane>
</template>

<script lang="ts">
import { RdfResource, RuntimeOperation } from 'alcaeus'
import { sh } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { CubeMetadata } from '@/types'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'

const projectNS = namespace('project')

@Component({
  components: { SidePane, FormSubmitCancel },
})
export default class CubeMetadataEdit extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: CubeMetadata;

  error: string | null = null;
  shapes: GraphPointer | null = null;

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

  get operation (): RuntimeOperation | null {
    return this.cubeMetadata.actions.edit
  }

  get title (): string {
    return this.operation?.title ?? 'Error: Missing operation'
  }

  onSubmit (): void {
    // TODO
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeDesigner' })
  }
}
</script>
