<template>
  <div>
    <p class="help">
      Use "," to separate tags
    </p>
    <b-field v-for="([language, objects], languageIndex) in tags" :key="language" :addons="false" class="is-flex">
      <b-taginput :value="objects" field="value" @add="addTag(language, $event)" @remove="removeTag" class="is-flex-grow-1" />
      <b-select :value="language" @input="updateLanguage(languageIndex, $event)">
        <option v-for="languageOption in languages" :key="languageOption">
          {{ languageOption }}
        </option>
      </b-select>
    </b-field>
    <div v-if="tags.length === 0">
      Nothing to display
    </div>
    <b-tooltip label="Add value">
      <b-button icon-left="plus" @click.prevent="renderer.actions.addObject" type="is-white" />
    </b-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { PropertyObjectState, PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import { PropertyRenderer } from '@hydrofoil/shaperone-core/renderer'
import $rdf from '@rdfjs/data-model'
import RenderWcTemplate from '../RenderWcTemplate.vue'
import { Literal, Term } from 'rdf-js'

// TODO: Keep an internal state to avoid auto-merging fields or removing field when no tags, etc.

@Component({
  components: { RenderWcTemplate },
})
export default class extends Vue {
  @Prop() property!: PropertyState
  @Prop() renderer!: PropertyRenderer
  @Prop() update!: (newValues: Term[]) => void

  get displayedObjects (): PropertyObjectState[] {
    return this.property.objects
  }

  get languages (): string[] {
    return this.property?.shape.languageIn || []
  }

  get tags (): [string, Term[]][] {
    const objects = this.property.objects

    const tags = new Map()
    for (const { object } of objects) {
      const term = object?.term

      if (term && term.termType !== 'Literal') throw new Error('Not a literal')

      const language = term?.language ?? ''
      if (!tags.has(language)) {
        tags.set(language, [])
      }

      if (term) {
        tags.get(language).push(term)
      }
    }

    return [...tags.entries()]
  }

  addTag (language: string, tag: string): void {
    const newTerm = $rdf.literal(tag, language)

    const terms = this.property.objects
      .map(({ object }) => object?.term)
      .filter((term): term is Term => !!term)

    terms.push(newTerm)

    this.update(terms)
  }

  removeTag (tag: Literal): void {
    const terms = this.property.objects
      .map(({ object }) => object?.term)
      .filter((term): term is Term => !!term)
      .filter((term) => !term.equals(tag))

    this.update(terms)
  }

  updateLanguage (languageIndex: number, newLanguage: string): void {
    const [, termsToChange] = this.tags[languageIndex]
    const updatedTerms = termsToChange.map((term) => $rdf.literal(term.value, newLanguage))
    const otherTerms = this.tags.filter((entry, index) => index !== languageIndex).map(([, terms]) => terms).flat()
    const terms = otherTerms.concat(updatedTerms)

    this.update(terms)
  }
}
</script>
