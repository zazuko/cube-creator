<template>
  <span v-if="!value" class="has-text-grey">
    {{ missingValue }}
  </span>
  <span v-else-if="isResource" class="tag is-rounded is-small">
    <term-display :term="value.id" />
  </span>
  <span v-else-if="isTerm">
    <term-display :term="value" />
  </span>
  <span v-else class="has-background-danger-light">
    Cannot display value
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import type RdfResource from '@tpluscode/rdfine/RdfResource'
import TermDisplay from './TermDisplay.vue'

type Value = RdfResource | Term | undefined

@Component({
  components: { TermDisplay },
})
export default class extends Vue {
  @Prop() value: Value
  @Prop({ default: '' }) missingValue?: string

  get isResource (): boolean {
    return isResource(this.value)
  }

  get isTerm (): boolean {
    return isTerm(this.value)
  }
}

function isResource (value: Value): value is RdfResource {
  return !!value && 'id' in value
}

function isTerm (value: Value): value is Term {
  return !!value && 'termType' in value
}
</script>
