<template>
  <span v-if="!value" class="has-text-grey">
    {{ missingValue }}
  </span>
  <router-link v-else-if="isResource" :to="{ name: 'ResourcePreview', params: { resourceId: value.id.value } }" class="tag is-rounded is-small">
    <term-with-language :values="label" :selected-language="selectedLanguage">
      <term-display :term="value.id" :base="cubeUri" />
    </term-with-language>
  </router-link>
  <span v-else-if="isTerm">
    <term-display :term="value" :base="cubeUri" />
  </span>
  <span v-else class="has-background-danger-light">
    Cannot display value
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import type RdfResource from '@tpluscode/rdfine/RdfResource'
import { schema } from '@tpluscode/rdf-ns-builders'
import TermDisplay from './TermDisplay.vue'
import TermWithLanguage from './TermWithLanguage.vue'

type Value = RdfResource | Term | undefined

@Component({
  components: { TermDisplay, TermWithLanguage },
})
export default class extends Vue {
  @Prop({ required: true }) value: Value
  @Prop({ default: '' }) missingValue?: string
  @Prop({ required: true }) selectedLanguage!: string
  @Prop({ required: true }) cubeUri!: string

  get label (): Term[] {
    if (!isResource(this.value)) return []

    return this.value.pointer.out(schema.name).terms
  }

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
