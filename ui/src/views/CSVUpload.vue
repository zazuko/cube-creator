<template>
  <side-pane title="Upload CSV file" @close="close">
    <form @submit.prevent="onSubmit">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <b-field>
        <uppy-dashboard v-if="uppy" :uppy="uppy" :props="uppyDashboardOptions" />
      </b-field>
    </form>
  </side-pane>
</template>

<script lang="ts">
import * as $rdf from '@rdfjs/dataset'
import RdfResourceImpl from '@tpluscode/rdfine'
import { schema } from '@tpluscode/rdf-ns-builders'
import AwsS3Multipart from '@uppy/aws-s3-multipart'
import Uppy from '@uppy/core'
import { Dashboard as UppyDashboard } from '@uppy/vue'
import clownface from 'clownface'
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

import { CsvMapping } from '@cube-creator/model'

import { api } from '@/api'
import SidePane from '@/components/SidePane.vue'
import FormSubmitCancel from '@/components/FormSubmitCancel.vue'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

const projectNS = namespace('project')

const apiURL = window.APP_CONFIG.apiCoreBase
// TODO: Should I grab this from the API?
const uploadURL = `${apiURL}upload`

@Component({
  components: { UppyDashboard, SidePane, FormSubmitCancel },
})
export default class CSVUploadView extends Vue {
  @projectNS.State('csvMapping') mapping!: CsvMapping

  error: string | null = null
  uppy: Uppy.Uppy<Uppy.StrictTypes> | null = null
  uppyDashboardOptions = {
    proudlyDisplayPoweredByUppy: false,
    showLinkToFileUploadResult: false,
    note: 'CSV files only',
    doneButtonHandler: this.close,
  }

  mounted (): void {
    const uppy = Uppy<Uppy.StrictTypes>({
      restrictions: { allowedFileTypes: ['.csv'] },
      meta: { csvMapping: this.mapping.id.value },
    })

    uppy.use(AwsS3Multipart, { companionUrl: uploadURL })
    uppy.addPreProcessor(async () => {
      // Hack to set fresh auth token before each upload
      const token = this.$store.state.auth.access_token;
      (uppy as any).plugins.uploader[0].client.opts.companionHeaders = { authorization: `Bearer ${token}` }
    })
    uppy.addPostProcessor(this.createSources)

    this.uppy = uppy
  }

  beforeDestroy (): void {
    this.uppy?.close()
  }

  async createSources (fileIDs: string[]): Promise<void> {
    const operation = this.mapping.sourcesCollection.actions?.upload ?? null
    const uploads = fileIDs.map((fileID) => {
      const file = this.uppy?.getFile(fileID) as any
      if (!file) throw new Error('File not found')

      const dataset = $rdf.dataset()
      const pointer = clownface({ dataset, term: $rdf.namedNode('') })
        .addOut(schema.name, $rdf.literal(file.name))
        .addOut(schema.identifier, $rdf.literal(file.s3Multipart.key))
        .addOut(schema.contentUrl, $rdf.namedNode(file.uploadURL))
      const resource = RdfResourceImpl.factory.createEntity(pointer)

      return api.invokeSaveOperation(operation, resource)
    })

    this.error = null

    try {
      await Promise.all(uploads)
    } catch (e) {
      this.error = e.toString()
      throw e
    }
  }

  async close (): Promise<void> {
    await this.$store.dispatch('project/refreshSourcesCollection')
    this.$router.push({ name: 'CSVMapping' })
  }
}
</script>
