<template>
  <div>Hello {{ dimension }}</div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const managedDimensionNS = namespace('managedDimension')

interface ManagedDimension {
  name: string
}

@Component
export default class extends Vue {
  @managedDimensionNS.State('dimension') dimension!: ManagedDimension | null;

  mounted (): void {
    const id = this.$route.params.id
    this.$store.dispatch('managedDimension/fetchDimension', id)
  }
}
</script>
