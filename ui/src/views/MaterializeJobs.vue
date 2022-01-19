<template>
  <div>
    <div class="mb-1">
      <b-button tag="router-link" :to="{ name: 'Materialize' }" icon-left="arrow-left" size="is-small">
        Back to {{ materializeLabel }}
      </b-button>
    </div>
    <div class="box">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import * as storeNs from '../store/namespace'

@Component
export default class MaterializeJobs extends Vue {
  @storeNs.project.Getter('materializeLabel') materializeLabel!: string;
}
</script>
