<template>
  <ul>
    <hierarchy-tree-level
      v-for="root in roots"
      :key="root.value"
      :root="root"
      :next-level="nextLevel"
      :endpoint-url="endpointUrl"
    />
    <li v-if="roots.length === 0" class="has-text-grey">
      Empty
    </li>
  </ul>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, PropType } from 'vue'
import { Term } from 'rdf-js'

import { NextInHierarchy } from '@/store/types'

const HierarchyTreeLevel: any = defineAsyncComponent(() => import('./HierarchyTreeLevel.vue'))

export default defineComponent({
  name: 'HiearchyTree',
  components: { HierarchyTreeLevel },
  props: {
    roots: {
      type: Array as PropType<Term[]>,
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
})
</script>
