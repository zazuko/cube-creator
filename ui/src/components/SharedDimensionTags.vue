<template>
  <div class="is-flex gap-1">
    <b-tag v-if="dimension.validThrough <= new Date()" type="is-warning is-light">
      deprecated
    </b-tag>
    <b-tag v-if="!dimension.actions.replace" type="is-light">
      read-only
    </b-tag>
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
