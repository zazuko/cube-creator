<template>
  <div v-if="project">
    <div class="tabs is-boxed mb-0 mt-2">
      <ul>
        <router-link :to="{ name: 'CubeProjectEdit' }" v-slot="{ href, navigate, route }" custom>
          <li :class="{ 'is-active': isRouteActive(route, $route) }">
            <o-tooltip label="Project settings">
              <a :href="href" @click="navigate">
                <h2 class="project-title has-text-weight-bold truncate">
                  {{ project.title }}
                </h2>
                <o-icon icon="cog" class="ml-1" />
              </a>
            </o-tooltip>
          </li>
        </router-link>
        <router-link v-if="hasCSVMapping" :to="{ name: 'CSVMapping' }" v-slot="{ href, navigate, route }" custom>
          <li :class="{ 'is-active': isRouteActive(route, $route) }">
            <a :href="href" @click="navigate">1. CSV Mapping</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'Materialize' }" v-slot="{ href, navigate, route }" custom>
          <li :class="{ 'is-active': isRouteActive(route, $route) }">
            <a :href="href" @click="navigate" class="is-capitalized">2. {{ materializeLabel }}</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'CubeDesigner' }" v-slot="{ href, navigate, route }" custom>
          <li :class="{ 'is-active': isRouteActive(route, $route) }">
            <a :href="href" @click="navigate">3. Cube Designer</a>
          </li>
        </router-link>
        <router-link :to="{ name: 'Publication' }" v-slot="{ href, navigate, route }" custom>
          <li :class="{ 'is-active': isRouteActive(route, $route) }">
            <a :href="href" @click="navigate">
              4. Publication
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
import { defineComponent } from 'vue'
import PageContent from '@/components/PageContent.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { mapGetters, mapState } from 'vuex'
import { isRouteActive } from '../router'

export default defineComponent({
  name: 'CubeProjectView',
  components: { PageContent, LoadingBlock },

  async mounted (): Promise<void> {
    const id = this.$route.params.id
    await this.$store.dispatch('project/fetchProject', id)

    if (this.$route.name === 'CubeProject') {
      if (this.hasCSVMapping) {
        this.$router.push({ name: 'CSVMapping' })
      } else {
        this.$router.push({ name: 'Materialize' })
      }
    }
  },

  beforeUnmount (): void {
    this.$store.dispatch('project/reset')
  },

  computed: {
    ...mapState('project', {
      project: 'project',
      jobCollection: 'jobCollection',
    }),
    ...mapGetters('project', {
      hasCSVMapping: 'hasCSVMapping',
      materializeLabel: 'materializeLabel',
      transformJobs: 'transformJobs',
    }),
  },

  methods: {
    isRouteActive,
  },
})
</script>

<style scoped>
.tabs {
  /* Fix dropdown displayed under page content */
  overflow: visible;
}

.tab-right {
  margin-left: auto;
}

.tab-right ~ .tab-right {
  margin-left: 0;
}

.project-title {
  max-width: 34rem;
}
</style>
