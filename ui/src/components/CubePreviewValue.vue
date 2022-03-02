<template>
  <span v-if="!value" class="has-text-grey">
    {{ missingValue }}
  </span>
  <router-link v-else-if="isResource" :to="{ name: 'ResourcePreview', params: { resourceId: value.id.value, sharedTerm: isSharedTerm } }" class="tag is-rounded is-small">
    <external-term :resource="value" :base="cubeUri" :selected-language="selectedLanguage" />
  </router-link>
  <span v-else-if="isTerm" :class="termClasses">
    <term-display :term="value" :base="cubeUri" :show-language="showLanguage" />
  </span>
  <span v-else class="has-background-danger-light">
    Cannot display value
  </span>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { Literal, Term } from 'rdf-js'
import type RdfResource from '@tpluscode/rdfine/RdfResource'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import TermDisplay from './TermDisplay.vue'
import ExternalTerm from './ExternalTerm.vue'

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

export default defineComponent({
  name: 'CubePreviewValue',
  components: { ExternalTerm, TermDisplay },
  props: {
    isSharedTerm: {
      type: Boolean,
      default: false,
    },
    value: {
      type: Object as PropType<Value>,
      required: true,
    },
    missingValue: {
      type: String,
      default: '',
    },
    selectedLanguage: {
      type: String,
      required: true,
    },
    cubeUri: {
      type: String,
      required: true,
    },
    showLanguage: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    label (): Term[] {
      if (!isResource(this.value)) return []

      return this.value.pointer.out(schema.name).terms
    },

    isResource (): boolean {
      return isResource(this.value)
    },

    isTerm (): boolean {
      return isTerm(this.value)
    },

    termClasses (): string {
      const value = this.value

      if (isLiteral(value)) {
        if (numericalDatatypes.has(value.datatype)) {
          return 'is-family-monospace'
        } else if (temporalDatatypes.has(value.datatype)) {
          return 'border-bottom-1 border-yellow'
        }
      }

      return ''
    },
  },
})

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
