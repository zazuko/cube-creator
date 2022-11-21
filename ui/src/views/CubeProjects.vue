<template>
  <page-content class="container-narrow">
    <div class="mb-4 is-flex is-align-items-center is-justify-content-space-between">
      <h2 class="title is-size-4 mb-0">
        Cube projects
      </h2>
      <div v-if="projectsCollection">
        <hydra-operation-button
          :operation="projectsCollection.actions.create"
          :to="{ name: 'CubeProjectCreate' }"
          variant="default"
          size="normal"
          :label="projectsCollection.actions.create.title"
        />
      </div>
    </div>
    <div v-if="projectsCollection">
      <div class="panel-block">
        <cc-hydra-operation-form
          inline clearable
          :operation.prop="operation"
          :resource.prop="searchParams"
          :shape.prop="shape"
          @submit="onSearch"
          submit-when-cleared
        />
      </div>
      <div v-if="projects.length > 0" class="panel">
        <cube-projects-item
          v-for="project in projects"
          :key="project.id.value"
          :project="project"
          class="panel-block"
        />
      </div>
      <p v-else class="has-text-grey">
        No projects yet
      </p>
    </div>
    <loading-block v-else />

    <router-view v-if="projectsCollection" />
  </page-content>
</template>

<script lang="ts">
import { defineComponent, shallowRef } from 'vue'
import { Project } from '@cube-creator/model'
import CubeProjectsItem from '@/components/CubeProjectsItem.vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import { mapGetters, mapState } from 'vuex'
import { getRouteSearchParamsFromTemplatedOperation, isRouteActive } from '@/router'
import { useHydraForm } from '@/use-hydra-form'
import '@/customElements/HydraOperationForm'
import { rootURL } from '@/api/index'

export default defineComponent({
  name: 'CubeProjectsView',
  components: { CubeProjectsItem, PageContent, LoadingBlock, HydraOperationButton },

  async mounted (): Promise<void> {
    const emptyQuery = Object.entries(this.$route.query).length === 0

    if (emptyQuery && this.user) {
      await this.$router.replace({
        query: {
          author: `${rootURL}user/${this.user.sub}`
        }
      })
    } else {
      await this.$store.dispatch('projects/fetchCollection')
    }

    this.operation = this.projectsCollection.actions.get
    this.searchParams = this.projectsCollection.searchParams
  },

  setup () {
    const operation = shallowRef()

    const form = useHydraForm(operation)

    return {
      ...form,
      searchParams: shallowRef()
    }
  },

  computed: {
    ...mapState('projects', {
      projectsCollection: 'collection',
    }),
    ...mapGetters('auth', {
      user: 'oidcUser',
    }),

    projects (): Project[] {
      return this.projectsCollection?.member ?? []
    },
  },

  async beforeRouteUpdate (to) {
    await this.$store.dispatch('projects/fetchCollection', to.query)
    this.searchParams = this.projectsCollection.searchParams
  },

  methods: {
    isRouteActive,

    onSearch (e: CustomEvent) {
      if (this.operation && e.detail?.value) {
        this.$router.push({
          query: getRouteSearchParamsFromTemplatedOperation(this.operation, e.detail?.value),
        })
      }
    }
  },
})
</script>

<style scoped>
cc-hydra-operation-form {
  width: 100%;
}
</style>
