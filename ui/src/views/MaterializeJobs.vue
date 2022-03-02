<template>
  <div>
    <div class="mb-1">
      <o-button tag="router-link" :to="{ name: 'Materialize' }" icon-left="arrow-left" size="small">
        Back to {{ materializeLabel }}
      </o-button>
    </div>
    <div class="box container-narrow">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import * as storeNs from '../store/namespace'

@Component
export default class MaterializeJobs extends Vue {
  @storeNs.project.Getter('materializeLabel') materializeLabel!: string
}
</script>
