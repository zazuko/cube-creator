<template>
  <div v-if="project">
    <div class="tabs project-tabs is-boxed">
      <ul>
        <li class="tab">
          <h2 class="project-title">
            {{ project.title }}
          </h2>
        </li>
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
        <router-link :to="{ name: 'Pipeline' }" v-slot="{ href, isActive, navigate }">
          <li :class="{ 'is-active': isActive }">
            <a :href="href" @click="navigate">
              Pipeline
            </a>
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
      <router-view />
    </page-content>
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { State } from 'vuex-class'
import { Project } from '@cube-creator/model'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'

@Component({
  components: { PageContent, LoadingBlock },
})
export default class CubeProjectView extends Vue {
  @State('project', { namespace: 'project' }) project!: Project | null;

  async mounted (): Promise<void> {
    const id = this.$router.currentRoute.params.id
    await this.$store.dispatch('project/fetchProject', id)

    if (this.$router.currentRoute.name === 'CubeProject') {
      if (this.hasCSVMapping) {
        this.$router.push({ name: 'CSVMapping' })
      } else {
        this.$router.push({ name: 'CubeDesigner' })
      }
    }
  }

  get hasCSVMapping (): boolean {
    return !!this.project?.csvMapping
  }
}
</script>

<style scoped>
.tabs.project-tabs {
  margin-bottom: 0;
  margin-top: 0.5rem;
}

.project-title {
  font-weight: bold;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
}

.tab-right {
  margin-left: auto;
}

.tab-right ~ .tab-right {
  margin-left: 0;
}
</style>
