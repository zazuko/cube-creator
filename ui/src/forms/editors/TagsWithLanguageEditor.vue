<template>
  <div>
    <o-field v-for="([language, objects], languageIndex) in tags" :key="languageIndex" :addons="false" class="is-flex">
      <o-inputitems
        :model-value="objects"
        field="value"
        @add="addTag(languageIndex, language, $event)"
        @remove="removeTag(languageIndex, $event)"
        class="is-flex-grow-1"
      />
      <o-select :model-value="language" @update:modelValue="updateLanguage(languageIndex, $event)">
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
import { defineComponent, PropType } from 'vue'
import { PropertyState } from '@hydrofoil/shaperone-core/models/forms'
import $rdf from '@rdfjs/data-model'
import type { Literal, Term } from '@rdfjs/types'

export default defineComponent({
  name: 'TagsWithLanguageEditor',
  props: {
    property: {
      type: Object as PropType<PropertyState>,
      required: true,
    },
    update: {
      type: Function as PropType<(newValues: Term[]) => void>,
      required: true,
    },
  },

  data (): { tags: [string, Term[]][] } {
    return {
      // List of [language, tags]
      tags: []
    }
  },

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
  },

  computed: {
    languages (): string[] {
      return this.property?.shape.languageIn || []
    },
  },

  methods: {
    addLanguage (): void {
      const usedLanguages = new Set(this.tags.map(([language]) => language))
      const nextLanguage = this.languages.filter((language) => !usedLanguages.has(language))[0] || ''

      this.tags.push([nextLanguage, []])
    },

    addTag (languageIndex: number, language: string, tagValue: string): void {
      const newTerm = $rdf.literal(tagValue, language)
      this.tags[languageIndex][1].push(newTerm)

      this.updateFromTags()
    },

    removeTag (languageIndex: number, tag: Literal): void {
      this.tags[languageIndex][1] = this.tags[languageIndex][1].filter(term => !term.equals(tag))

      this.updateFromTags()
    },

    updateLanguage (languageIndex: number, newLanguage: string): void {
      const updatedTerms = this.tags[languageIndex][1].map(term => $rdf.literal(term.value, newLanguage))
      this.tags[languageIndex] = [newLanguage, updatedTerms]

      this.updateFromTags()
    },

    updateFromTags (): void {
      const terms = this.tags.flatMap(([, terms]) => terms)
      this.update(terms)
    },
  },
})
</script>
