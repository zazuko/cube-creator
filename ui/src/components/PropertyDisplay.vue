<template>
  <b-tooltip :label="expanded">
    {{ shrunk }}
  </b-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'
import { CreateIdentifier } from '@/store/modules/project'

const projectNS = namespace('project')

@Component
export default class PropertyDisplay extends Vue {
  @Prop() term!: Term
  @projectNS.State('createIdentifier') createIdentifier!: CreateIdentifier

  get value (): string {
    return this.term.value || ''
  }

  get expanded (): string {
    return this.createIdentifier(this.term)
  }

  get shrunk (): string {
    return shrink(this.value)
  }
}
</script>
