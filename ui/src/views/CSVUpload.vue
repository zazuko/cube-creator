<template>
  <side-pane :is-open="true" title="Upload CSV file" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <b-field>
        <b-upload v-model="files" multiple drag-drop accept=".csv">
          <section class="section">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large" />
              </p>
              <p>Drop your files here or click to select files from your disk</p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <div class="tags">
        <span v-for="(file, index) in files" :key="index" class="tag is-primary">
          {{ file.name }}
          <button class="delete is-small" type="button" @click="removeFile(index)" />
        </span>
      </div>

      <form-submit-cancel submit-label="Upload" @cancel="onCancel" :disabled="files.length === 0" />
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import { APIErrorConflict, APIErrorValidation } from '@/api/errors'

@Component({
  components: { SidePane, FormSubmitCancel },
})
export default class CSVUploadView extends Vue {
  files: File[] = []
  error: string | null = null

  async onSubmit (): Promise<void> {
    this.error = null
    const loader = this.$buefy.loading.open({})

    try {
      await this.$store.dispatch('project/uploadCSVs', this.files)

      await this.$store.dispatch('project/refreshSourcesCollection')

      this.$router.push({ name: 'CSVMapping' })
    } catch (e) {
      if (e instanceof APIErrorConflict) {
        this.error = 'Cannot upload a file with the same name twice'
      } else if (e instanceof APIErrorValidation) {
        this.error = e.details?.title ?? null
      } else {
        console.error(e)
        this.error = e.toString()
      }
    } finally {
      loader.close()
    }
  }

  onCancel (): void {
    this.$router.push({ name: 'CSVMapping' })
  }

  removeFile (index: number): void {
    this.files.splice(index, 1)
  }
}
</script>
