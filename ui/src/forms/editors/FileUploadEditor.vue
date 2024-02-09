<template>
  <o-field class="file is-primary" :class="{'has-name': !!file}">
    <o-upload v-model="file" class="file-label" @update:modelValue="onFileSelected">
      <span class="file-cta">
        <o-icon class="file-icon" icon="upload" />
        <span class="file-label">Select file</span>
      </span>
      <span class="file-name" v-if="file">
        {{ file.name }}
      </span>
    </o-upload>
  </o-field>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import type { Term } from '@rdfjs/types'
import { FileLiteral } from '@/forms/FileLiteral'

export default defineComponent({
  name: 'FileUploadEditor',
  props: {
    update: {
      type: Function as PropType<(term: Term) => void>,
      required: true,
    },
  },

  data (): { file: File | null } {
    return {
      file: null,
    }
  },

  methods: {
    onFileSelected (value: File): void {
      this.update(new FileLiteral(value))
    },
  },
})
</script>
