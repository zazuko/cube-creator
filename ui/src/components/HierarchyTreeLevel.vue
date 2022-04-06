<template>
  <li class="tree-level">
    <div class="tree-level-heading" @click="toggleOpen">
      <div class="tree-level-label">
        <button @click.stop="toggleOpen" class="tree-level-button" :disabled="!nextLevel">
          <o-icon :icon="isOpen ? 'chevron-down' : 'chevron-right'" />
        </button>
        <external-term :resource="root" />
      </div>
    </div>
    <div v-if="isOpen" class="tree-children">
      <hierarchy-tree
        v-if="children.isLoaded"
        :roots="children.data || []"
        :next-level="nextLevel.nextInHierarchy"
      />
      <loading-block v-else-if="children.isLoading" />
      <div v-else-if="children.error" class="message is-danger">
        <p class="message-body">
          {{ children.error }}
        </p>
      </div>
    </div>
  </li>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, ref, toRefs } from 'vue'
import { NamedNode, Term } from 'rdf-js'

import ExternalTerm from '@/components/ExternalTerm.vue'
import HierarchyTree from '@/components/HierarchyTree.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import * as hierarchy from '@/forms/editors/hierarchy'
import { NextInHierarchy } from '@/store/types'
import Remote, { RemoteData } from '@/remote'

export default defineComponent({
  name: 'HiearchyTreeLevel',
  components: { ExternalTerm, LoadingBlock, HierarchyTree },
  props: {
    root: {
      type: Object as PropType<NamedNode>,
      required: true,
    },
    nextLevel: {
      type: Object as PropType<NextInHierarchy>,
      default: null,
    },
  },

  setup (props) {
    const { nextLevel, root } = toRefs(props)

    const isOpen = ref(false)

    const children: Ref<RemoteData<Term[]>> = ref(Remote.notLoaded())

    const loadChildren = async () => {
      children.value = Remote.loading()

      try {
        const childrenPointers = await hierarchy.children(nextLevel.value, root.value)
        children.value = Remote.loaded(childrenPointers.map(({ term }) => term))
      } catch (e: any) {
        children.value = Remote.error(e.toString())
      }
    }

    const toggleOpen = () => {
      if (!nextLevel.value) return

      isOpen.value = !isOpen.value

      if (isOpen.value && !children.value.isLoaded) {
        loadChildren()
      }
    }

    return {
      isOpen,
      children,
      toggleOpen,
    }
  },
})
</script>

<style scoped>
.tree-level {
  flex-grow: 1;

  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.tree-level-heading {
  padding: 0.5em 0;
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-level-heading:hover {
  background-color: var(--color-grey-lighter);
}

.tree-level-label {
  flex-grow: 1;
}

.tree-level-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.tree-children {
  padding-left: 1.75em;
}
</style>
