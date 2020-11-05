<template>
  <div v-if="cubeMetadata">
    <h3>{{ cube.title }}</h3>
    <p class="has-text-small">{{ cube.id.value }}</p>
    <hydra-operation-button :operation="cubeMetadata.actions.edit" :to="{ name: 'CubeMetadataEdit' }" />

    <router-view />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import { Cube, CubeMetadata } from '../types'
import HydraOperationButton from '@/components/HydraOperationButton.vue'

const projectNS = namespace('project')

@Component({
  components: { HydraOperationButton },
})
export default class CubeDesignerView extends Vue {
  @projectNS.State('cubeMetadata') cubeMetadata!: CubeMetadata | null;

  get cube (): Cube | null {
    return this.cubeMetadata?.cube ?? null
  }

  mounted (): void {
    this.$store.dispatch('project/fetchCubeMetadata')
  }
}
</script>
