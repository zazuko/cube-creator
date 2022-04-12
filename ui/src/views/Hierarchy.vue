<template>
  <page-content class="container-narrow">
    <div v-if="hierarchy">
      <div class="mb-4 is-flex is-justify-content-space-between is-align-items-center gap-2">
        <div class="is-flex is-align-items-center gap-2">
          <h2 class="title is-size-4 mb-0">
            {{ hierarchy.name }}
          </h2>
        </div>
        <div class="is-flex is-align-items-center gap-1">
          <hydra-operation-button
            v-if="hierarchy.actions.replace"
            :operation="hierarchy.actions.replace"
            :to="{ name: 'HierarchyEdit' }"
            variant="default"
            size="normal"
            :label="hierarchy.actions.replace.title"
          />
        </div>
      </div>

      <section class="mb-4">
        <h3 class="title is-size-5">
          Definition
        </h3>

        <base-tree :tree-data="hierarchyTree" />
      </section>

      <section>
        <h3 class="title is-size-5">
          Sample data
        </h3>

        <hierarchy-tree
          :roots="hierarchyRoots"
          :next-level="hierarchy.nextInHierarchy"
          :endpoint-url="endpointUrl"
        />
      </section>

      <router-view />
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { dcterms, sd } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { defineComponent } from 'vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import HierarchyTree from '@/components/HierarchyTree.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import { mapState } from 'vuex'
import { BaseTree } from '@he-tree/vue3'
import { Hierarchy, NextInHierarchy } from '@/store/types'

interface Node {
  text: string
  children?: Node[]
}

export default defineComponent({
  name: 'HierarchyView',
  components: {
    HierarchyTree,
    HydraOperationButton,
    LoadingBlock,
    PageContent,
    BaseTree
  },

  mounted (): void {
    this.$store.dispatch('hierarchy/fetchHierarchy', this.$route.params.id)
  },

  unmounted () {
    this.$store.dispatch('hierarchy/reset')
  },

  computed: {
    ...mapState('hierarchy', {
      hierarchy: 'hierarchy',
    }),

    endpointUrl (): string {
      return this.hierarchy.pointer.out(dcterms.source).out(sd.endpoint).value
    },

    hierarchyRoots (): GraphPointer[] {
      return this.hierarchy.hierarchyRoot.map((term: NamedNode) => this.hierarchy.pointer.node(term))
    },

    hierarchyTree (): Node[] {
      const hierarchy: Hierarchy | null = this.hierarchy

      if (!hierarchy) {
        return []
      }

      const roots = hierarchy.hierarchyRoot.map(root => ({
        text: `Root: ${root.value}`
      }))

      const nextLevel = toNextLevelNode(hierarchy.nextInHierarchy)

      return [{
        text: `Dimension: ${hierarchy.dimension.value}`,
      },
      ...roots,
      {
        text: 'Levels:',
        children: [nextLevel]
      }]
    }
  },
})

function toNextLevelNode (level: NextInHierarchy): Node {
  const children = []
  if (level.nextInHierarchy) {
    children.push(toNextLevelNode(level.nextInHierarchy))
  }

  return {
    text: `- ${level.name}`,
    children,
  }
}
</script>

<style scoped>
.table > thead > tr > * {
  vertical-align: middle;
}
</style>
