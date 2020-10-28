<template>
  <div v-if="project">
    <div class="tabs project-tabs">
      <ul>
        <router-link v-if="hasCSVMapping" :to="{ name: 'CSVMapping' }" v-slot="{ href, isActive, navigate }">
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">CSV Mapping</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'CubeDesigner' }" v-slot="{ href, isActive, navigate }">
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">Cube Designer</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'CubeProjectEdit' }" v-slot="{ href, isActive, navigate }" v-if="project.actions.delete || project.actions.edit">
          <li :class="{ 'is-active': isActive }" class="tab-right">
            <a :href="href" @click="navigate">
              <b-icon icon="cog" />
              Project settings
            </a>
          </li>
        </router-link>
      </ul>
    </div>

    <page-content>
      <h2 class="title is-4">
        {{ project.title }}
      </h2>

      <router-view />
    </page-content>
  </div>
  <b-loading v-else active :is-full-page="false" />
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { Project } from '@/types'
import PageContent from '@/components/PageContent.vue'

export default Vue.extend({
  name: 'CubeProject',
  components: { PageContent },

  async mounted () {
    const id = this.$router.currentRoute.params.id
    await this.$store.dispatch('cubeProjects/fetchProject', id)

    if (this.$router.currentRoute.name === 'CubeProject') {
      if (this.hasCSVMapping) {
        this.$router.push({ name: 'CSVMapping' })
      } else {
        this.$router.push({ name: 'CubeDesigner' })
      }
    }
  },

  computed: {
    ...mapState({
      project: (state: any): Project => state.cubeProjects.project,
    }),

    hasCSVMapping () {
      return this.project?.csvMapping
    },
  }
})
</script>

<style scoped>
.tabs.project-tabs {
  margin-bottom: 0;
}

.tab-right {
  margin-left: auto;
}

.tab-right ~ .tab-right {
  margin-left: 0;
}
</style>
