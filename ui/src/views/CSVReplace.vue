<template>
  <side-pane :is-open="true" title="Replace CSV file" @close="onCancel">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <div class="content">
        <p>
          You can upload a new CSV file to replace <em>{{ source.name }}</em>.
        </p>
        <p>
          Columns must have the same names as the original CSV file.
          New columns can be added.
        </p>
      </div>

      <b-field>
        <b-upload v-model="file" drag-drop accept=".csv">
          <section class="section">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large" />
              </p>
              <p>Drop your file here or click to select a file from your disk</p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <div class="tags">
        <span v-if="file" class="tag is-primary">
          {{ file.name }}
          <button class="delete is-small" type="button" @click="removeFile" />
        </span>
      </div>

      <form-submit-cancel submit-label="Replace CSV file" @cancel="onCancel" :disabled="!file" />
    </form>
  </side-pane>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'
import { APIErrorConflict, APIErrorValidation, APIPayloadTooLarge } from '@/api/errors'
import { CsvSource } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: { SidePane, FormSubmitCancel },
})
export default class CSVUploadView extends Vue {
  @projectNS.Getter('findSource') findSource!: (id: string) => CsvSource

  file: File | null = null
  error: string | null = null

  get source (): CsvSource {
    const sourceId = this.$route.params.sourceId
    return this.findSource(sourceId)
  }

  async onSubmit (): Promise<void> {
    this.error = null
    const loader = this.$buefy.loading.open({})

    try {
      await this.$store.dispatch('project/replaceCSV', { source: this.source, file: this.file })

      await this.$store.dispatch('project/refreshSourcesCollection')

      this.$router.push({ name: 'CSVMapping' })
    } catch (e) {
      if (e instanceof APIErrorValidation) {
        this.error = e.details.detail ?? { detail: e.toString() }
        console.log(e)
      } else if (e instanceof APIPayloadTooLarge) {
        this.error = 'CSV file is too large'
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

  removeFile (): void {
    this.file = null
  }
}
</script>
