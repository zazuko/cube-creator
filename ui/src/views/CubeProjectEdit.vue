<template>
  <div>
    <div class="box container-narrow" v-if="project.actions.edit">
      <h3 class="title is-5">
        {{ project.actions.edit.title }}
      </h3>
      <hydra-operation-form
        :operation="project.actions.edit"
        :resource="resource"
        :shape="shape"
        :error="error"
        :is-submitting="isSubmitting"
        @submit="updateProject"
        :show-cancel="false"
        submit-label="Save project settings"
      />
    </div>
    <div class="box container-narrow" v-if="project.export">
      <h3 class="title is-5">
        Export project
      </h3>
      <o-field>
        <download-button :resource="project.export" />
      </o-field>
    </div>
    <div class="box container-narrow" v-if="project.actions.delete">
      <h3 class="title is-5">
        Delete project
      </h3>
      <p class="block">
        Delete all data related to this project. This operation is not revertible!
      </p>
      <o-field v-if="project.actions.delete">
        <o-button icon-left="trash" variant="danger" @click="deleteProject">
          {{ project.actions.delete.title }}
        </o-button>
      </o-field>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { Project } from '@cube-creator/model'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import DownloadButton from '@/components/DownloadButton.vue'
import { GraphPointer } from 'clownface'
import { Shape } from '@rdfine/shacl'
import { api } from '@/api'
import { APIErrorValidation, ErrorDetails } from '@/api/errors'
import * as storeNs from '../store/namespace'
import { displayToast } from '@/use-toast'
import { confirmDialog } from '@/use-dialog'

@Component({
  components: { HydraOperationForm, DownloadButton },
})
export default class CubeProjectEditView extends Vue {
  @storeNs.project.State('project') project!: Project

  resource: GraphPointer | null = null
  shape: Shape | null = null
  isSubmitting = false
  error: ErrorDetails | null = null

  async mounted (): Promise<void> {
    const operation = this.project.actions.edit

    if (operation) {
      this.shape = await api.fetchOperationShape(operation)
    }

    this.resource = Object.freeze(this.project.pointer)
  }

  async updateProject (resource: GraphPointer): Promise<void> {
    const operation = this.project.actions.edit

    this.error = null
    this.isSubmitting = true

    try {
      const project = await this.$store.dispatch('api/invokeSaveOperation', {
        operation: operation,
        resource,
      })

      this.$store.commit('project/storeProject', project)

      displayToast(this, {
        message: 'Project settings were saved',
        variant: 'success',
      })
    } catch (e) {
      this.error = e.details ?? { detail: e.toString() }

      if (!(e instanceof APIErrorValidation)) {
        console.error(e)
      }
    } finally {
      this.isSubmitting = false
    }
  }

  async deleteProject (): Promise<void> {
    confirmDialog(this, {
      title: this.project.actions.delete?.title,
      message: 'Are you sure you want to delete this project? This action is not revertible.',
      confirmText: 'Delete',
      onConfirm: async () => {
        await this.$store.dispatch('api/invokeDeleteOperation', {
          operation: this.project.actions.delete,
          successMessage: `Project ${this.project.label} successfully deleted`,
          callbackAction: 'projects/fetchCollection',
        })
        this.$router.push({ name: 'CubeProjects' })
      },
    })
  }
}
</script>
