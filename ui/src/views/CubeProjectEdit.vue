<template>
  <div>
    <b-field v-if="project.actions.delete">
      <b-button icon-left="trash" type="is-danger" @click="deleteProject">
        {{ project.actions.delete.title }}
      </b-button>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Project } from '@cube-creator/model'

const projectNS = namespace('project')

@Component({
  components: {},
})
export default class CubeProjectEditView extends Vue {
  @projectNS.State('project') project!: Project

  async deleteProject (): Promise<void> {
    this.$buefy.dialog.confirm({
      title: this.project.actions.delete?.title,
      message: 'Are you sure you want to delete this project? This action is not reversible.',
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
