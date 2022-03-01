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
import { Vue, Component, Prop } from 'vue-property-decorator'
import { SharedDimension } from '@/store/types'

@Component
export default class extends Vue {
  @Prop({ required: true }) dimension!: SharedDimension
}
</script>
