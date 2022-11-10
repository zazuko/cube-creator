<template>
  <o-select
    :model-value="selectedLanguage"
    @update:modelValue="$emit('language-selected', $event)"
    class="level-item"
    title="Language"
  >
    <option v-for="language in languages" :key="language" :value="language">
      {{ language }}
    </option>
  </o-select>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { supportedLanguages } from '@cube-creator/core/languages'

export default defineComponent({
  name: 'LanguageSelect',

  props: {
    selectedLanguage: {
      type: String,
      default: 'en'
    }
  },

  emits: ['language-selected'],

  data () {
    return {
      languages: supportedLanguages.map(({ value }) => value),
    }
  }
})
</script>
