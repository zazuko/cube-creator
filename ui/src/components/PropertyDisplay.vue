<template>
  <b-tooltip :label="expanded">
    {{ shrunk }}
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Term } from 'rdf-js'
import { expandWithBase, shrink } from '@/rdf-properties'

const projectNS = namespace('project')

@Component
export default class PropertyDisplay extends Vue {
  @Prop() term!: Term
  @projectNS.State((state) => state.csvMapping?.namespace.value || '') projectPrefix!: string

  get value (): string {
    return this.term.value || ''
  }

  get expanded (): string {
    return expandWithBase(this.value, this.projectPrefix)
  }

  get shrunk (): string {
    return shrink(this.value)
  }
}
</script>
