<template>
  <li class="tree-level">
    <div class="tree-level-heading" @click="toggleOpen">
      <div class="tree-level-label">
        <button @click.stop="toggleOpen" class="tree-level-button" :disabled="!nextLevel">
          <o-icon :icon="isOpen ? 'chevron-down' : 'chevron-right'" />
        </button>
        <external-term :resource="root" />
        <external-term-link :term="root.term" />
      </div>
    </div>
    <div v-if="isOpen" class="tree-children">
      <hierarchy-tree
        v-if="children.isLoaded"
        :roots="children.data || []"
        :next-level="nextLevel.nextInHierarchy"
        :endpoint-url="endpointUrl"
      />
      <o-button v-if="children.isLoaded && mayHaveMore" @click="loadMore" variant="white">
        ... Load more
      </o-button>
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
import { GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'
import { defineComponent, PropType, Ref, ref, toRefs } from 'vue'

import ExternalTerm from '@/components/ExternalTerm.vue'
import HierarchyTree from '@/components/HierarchyTree.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import ExternalTermLink from '@/components/ExternalTermLink.vue'
import * as hierarchy from '@/forms/editors/hierarchy'
import { NextInHierarchy } from '@/store/types'
import Remote, { RemoteData } from '@/remote'

export default defineComponent({
  name: 'HiearchyTreeLevel',
  components: { ExternalTerm, LoadingBlock, HierarchyTree, ExternalTermLink },
  props: {
    root: {
      type: Object as PropType<GraphPointer<NamedNode>>,
      required: true,
    },
    nextLevel: {
      type: Object as PropType<NextInHierarchy>,
      default: null,
    },
    endpointUrl: {
      type: String,
      required: true,
    },
  },

  setup (props) {
    const { endpointUrl, nextLevel, root } = toRefs(props)

    const isOpen = ref(false)

    const children: Ref<RemoteData<GraphPointer[]>> = ref(Remote.notLoaded())
    const mayHaveMore = ref(false)
    const pageSize = 10
    const offset = ref(0)

    const loadPage = async () => {
      try {
        const page = await hierarchy.children(
          endpointUrl.value,
          nextLevel.value,
          root.value.term,
          pageSize,
          offset.value
        )

        mayHaveMore.value = page.length >= pageSize
        children.value = Remote.loaded((children.value?.data ?? []).concat(page))
      } catch (e: any) {
        children.value = Remote.error(e.toString())
      }
    }

    const toggleOpen = () => {
      if (!nextLevel.value) return

      isOpen.value = !isOpen.value

      if (isOpen.value && !children.value.isLoaded) {
        children.value = Remote.loading()
        loadPage()
      }
    }

    const loadMore = () => {
      offset.value = offset.value + pageSize
      loadPage()
    }

    return {
      isOpen,
      children,
      toggleOpen,
      mayHaveMore,
      loadMore,
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

  display: flex;
  align-items: center;
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
