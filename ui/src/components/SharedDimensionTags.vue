<template>
  <div class="is-flex gap-1">
    <span v-if="dimension.validThrough <= new Date()" class="tag is-warning is-light">
      deprecated
    </span>
    <span v-if="!dimension.actions.replace" class="tag is-light">
      read-only
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api'
import { SharedDimension } from '@/store/types'

export default defineComponent({
  name: 'SharedDimensionTags',
  props: {
    dimension: {
      type: Object as PropType<SharedDimension>,
      required: true,
    }
  },
})
</script>
