<template>
  <o-tooltip :label="expanded">
    {{ shrunk }}
  </o-tooltip>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'
import { CreateIdentifier } from '../store/modules/project'
import * as storeNs from '../store/namespace'

@Component
export default class PropertyDisplay extends Vue {
  @Prop() term!: Term

  @storeNs.project.State('createIdentifier') createIdentifier!: CreateIdentifier

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
