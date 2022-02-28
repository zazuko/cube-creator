<template>
  <div>
    <o-field v-for="([language, objects], languageIndex) in tags" :key="languageIndex" :addons="false" class="is-flex">
      <b-taginput
        :value="objects"
        field="value"
        @add="addTag(languageIndex, language, $event)"
        @remove="removeTag(languageIndex, $event)"
        class="is-flex-grow-1"
      />
      <o-select :value="language" @input="updateLanguage(languageIndex, $event)">
        <option v-for="languageOption in languages" :key="languageOption">
          {{ languageOption }}
        </option>
      </o-select>
    </o-field>
    <o-tooltip label="Add value">
      <o-button icon-left="plus" @click="addLanguage" variant="white" />
    </o-tooltip>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'
import { PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import $rdf from '@rdfjs/data-model'
import { Literal, Term } from 'rdf-js'

@Component
export default class extends Vue {
  @Prop() property!: PropertyState
  @Prop() update!: (newValues: Term[]) => void

  // List of [language, tags]
  tags: [string, Term[]][] = []

  mounted (): void {
    // Ignoring non-literals
    const tags = this.property.objects
      .map(({ object }) => object?.term)
      .filter((term): term is Literal => !!term && term.termType === 'Literal')

    const tagsByLanguage = new Map()
    for (const tag of tags) {
      const language = tag.language || ''

      if (!tagsByLanguage.has(language)) {
        tagsByLanguage.set(language, [])
      }

      tagsByLanguage.get(language).push(tag)
    }

    this.tags = [...tagsByLanguage.entries()]
  }

  get languages (): string[] {
    return this.property?.shape.languageIn || []
  }

  addLanguage (): void {
    const usedLanguages = new Set(this.tags.map(([language]) => language))
    const nextLanguage = this.languages.filter((language) => !usedLanguages.has(language))[0] || ''

    this.tags.push([nextLanguage, []])
  }

  addTag (languageIndex: number, language: string, tagValue: string): void {
    const newTerm = $rdf.literal(tagValue, language)
    this.tags[languageIndex][1].push(newTerm)

    this.updateFromTags()
  }

  removeTag (languageIndex: number, tag: Literal): void {
    this.tags[languageIndex][1] = this.tags[languageIndex][1].filter(term => !term.equals(tag))

    this.updateFromTags()
  }

  updateLanguage (languageIndex: number, newLanguage: string): void {
    const updatedTerms = this.tags[languageIndex][1].map(term => $rdf.literal(term.value, newLanguage))
    this.tags[languageIndex] = [newLanguage, updatedTerms]

    this.updateFromTags()
  }

  updateFromTags (): void {
    const terms = this.tags.flatMap(([, terms]) => terms)
    this.update(terms)
  }
}
</script>
