<template>
  <span v-if="!value" class="has-text-grey">
    {{ missingValue }}
  </span>
  <router-link v-else-if="isResource" :to="{ name: 'ResourcePreview', params: { resourceId: value.id.value, sharedTerm: isSharedTerm } }" class="tag is-rounded is-small">
    <term-with-language :values="label" :selected-language="selectedLanguage">
      <term-display :term="value.id" :base="cubeUri" />
    </term-with-language>
  </router-link>
  <span v-else-if="isTerm" :class="termClasses">
    <term-display :term="value" :base="cubeUri" :show-language="showLanguage" />
  </span>
  <span v-else class="has-background-danger-light">
    Cannot display value
  </span>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { Literal, Term } from 'rdf-js'
import type RdfResource from '@tpluscode/rdfine/RdfResource'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import TermDisplay from './TermDisplay.vue'
import TermWithLanguage from './TermWithLanguage.vue'

type Value = RdfResource | Term | undefined

const numericalDatatypes: TermSet = new TermSet([
  xsd.int,
  xsd.integer,
  xsd.decimal,
  xsd.float,
])

const temporalDatatypes: TermSet = new TermSet([
  xsd.date,
  xsd.dateTime,
  xsd.time,
  xsd.dateTimeStamp,
  xsd.dayTimeDuration,
  xsd.gDay,
  xsd.gMonth,
  xsd.gMonthDay,
  xsd.gYear,
  xsd.gYearMonth,
])

@Component({
  components: { TermDisplay, TermWithLanguage },
})
export default class extends Vue {
  @Prop({ required: true }) isSharedTerm!: boolean
  @Prop({ required: true }) value: Value
  @Prop({ default: '' }) missingValue?: string
  @Prop({ required: true }) selectedLanguage!: string
  @Prop({ required: true }) cubeUri!: string
  @Prop({ default: false }) showLanguage!: boolean

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

  get termClasses (): string {
    const value = this.value

    if (isLiteral(value)) {
      if (numericalDatatypes.has(value.datatype)) {
        return 'is-family-monospace'
      } else if (temporalDatatypes.has(value.datatype)) {
        return 'border-bottom-1 border-yellow'
      }
    }

    return ''
  }
}

function isResource (value: Value): value is RdfResource {
  return !!value && 'id' in value
}

function isTerm (value: Value): value is Term {
  return !!value && 'termType' in value
}

function isLiteral (value: Value): value is Literal {
  return isTerm(value) && value.termType === 'Literal'
}
</script>
