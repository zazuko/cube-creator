<template>
  <o-field class="file is-primary" :class="{'has-name': !!file}">
    <b-upload v-model="file" class="file-label" @input="onFileSelected">
      <span class="file-cta">
        <o-icon class="file-icon" icon="upload" />
        <span class="file-label">Select file</span>
      </span>
      <span class="file-name" v-if="file">
        {{ file.name }}
      </span>
    </b-upload>
  </o-field>
</template>

<script lang="ts">
import { Prop, Component, Vue } from 'vue-property-decorator'
import { Term } from 'rdf-js'
import { FileLiteral } from '@/forms/FileLiteral'

@Component
export default class FileUploadEditor extends Vue {
  file: File | null = null
  @Prop() update!: (term: Term) => void

  onFileSelected (value: File): void {
    this.update(new FileLiteral(value))
  }
}
</script>
