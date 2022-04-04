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
        @submit="onSubmit"
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
import { defineComponent, shallowRef } from 'vue'
import { useStore } from 'vuex'

import DownloadButton from '@/components/DownloadButton.vue'
import HydraOperationForm from '@/components/HydraOperationForm.vue'
import { RootState } from '@/store/types'
import { confirmDialog } from '@/use-dialog'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'CubeProjectEditView',
  components: { HydraOperationForm, DownloadButton },

  setup () {
    const store = useStore<RootState>()

    const project = store.state.project.project
    if (!project) throw new Error('Project not loaded')

    const operation = shallowRef(project.actions.edit)

    const form = useHydraForm(operation, {
      afterSubmit (project: any) {
        store.commit('project/storeProject', project)

        displayToast({
          message: 'Project settings were saved',
          variant: 'success',
        })
      },
    })

    if (project) {
      form.resource.value = Object.freeze(project.pointer)
    }

    return {
      ...form,
      project,
    }
  },

  methods: {
    async deleteProject (): Promise<void> {
      confirmDialog({
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
    },
  },
})
</script>
