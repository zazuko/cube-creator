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
      <b-field>
        <download-button :resource="project.export" />
      </b-field>
    </div>
    <div class="box container-narrow" v-if="project.actions.delete">
      <h3 class="title is-5">
        Delete project
      </h3>
      <p class="block">
        Delete all data related to this project. This operation is not revertible!
      </p>
      <b-field v-if="project.actions.delete">
        <b-button icon-left="trash" type="is-danger" @click="deleteProject">
          {{ project.actions.delete.title }}
        </b-button>
      </b-field>
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

      this.$buefy.toast.open({
        message: 'Project settings were saved',
        type: 'is-success',
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
    this.$buefy.dialog.confirm({
      title: this.project.actions.delete?.title,
      message: 'Are you sure you want to delete this project? This action is not revertible.',
      confirmText: 'Delete',
      type: 'is-danger',
      hasIcon: true,
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
