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
          <hydra-operation-button :operation="hierarchy.actions.replace" :to="{ name: 'HierarchyEdit' }" />
        </div>
      </div>
      <base-tree :tree-data="hierarchyTree" />

      <router-view />
    </div>
    <loading-block v-else />
  </page-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import PageContent from '@/components/PageContent.vue'
import { mapState } from 'vuex'
import { BaseTree } from '@he-tree/vue3'
import { Hierarchy, NextInHierarchy } from '@/store/types'

interface Node {
  text: string
  children?: Node[]
}

function toNextLevelNode (level: NextInHierarchy): Node {
  const text = level.name

  const property = {
    text: `Property: ${level.property.inversePath ? `^${level.property.inversePath.value}` : level.property.id.value}`
  }

  let types = level.targetType
    .map(targetClass => ({
      text: `Target type: ${targetClass.value}`
    }))

  if (!types.length) {
    types = [{ text: 'Target type: any' }]
  }

  const children = [property, ...types]
  if (level.nextInHierarchy) {
    children.push(toNextLevelNode(level))
  }

  return {
    text: `Next level: ${text}`,
    children,
  }
}

export default defineComponent({
  name: 'SharedDimensionView',
  components: {
    HydraOperationButton,
    LoadingBlock,
    PageContent,
    BaseTree
  },

  mounted (): void {
    this.$store.dispatch('sharedDimensions/fetchHierarchy', this.$route.params.id)
  },

  unmounted () {
    this.$store.dispatch('sharedDimensions/resetHierarchy')
  },

  computed: {
    ...mapState('sharedDimensions', {
      hierarchy: 'hierarchy',
    }),

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
      nextLevel]
    }
  },
})
</script>

<style scoped>
.table > thead > tr > * {
  vertical-align: middle;
}
</style>
