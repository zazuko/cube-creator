<template>
  <p :title="resourceId.value">
    {{ name }}
  </p>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { Hydra } from 'alcaeus/web'
import { schema } from '@tpluscode/rdf-ns-builders'

@Component
export default class ExternalResource extends Vue {
  @Prop({ required: true }) resourceId?: Term | undefined

  name = ''
  title = ''

  async mounted () {
    if (this.resourceId?.termType === 'NamedNode') {
      const { representation } = await Hydra.loadResource(this.resourceId.value)
      if (representation?.root) {
        [this.name] = representation.root.pointer.out(schema.name, { language: ['en', '*'] }).values
      } else {
        this.name = this.resourceId.value
      }
    } else {
      this.name = this.resourceId?.value || ''
    }

    this.title = this.resourceId?.value || ''
  }
}
</script>
