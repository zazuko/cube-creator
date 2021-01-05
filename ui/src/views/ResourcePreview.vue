<template>
  <side-pane :is-open="true" title="Resource preview" @close="onCancel">
    <b-message type="is-warning" title="Work in progress">
      This pane will show details about the selected resource.
    </b-message>
  </side-pane>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import type RdfResource from '@tpluscode/rdfine/RdfResource'
import SidePane from '@/components/SidePane.vue'

@Component({
  components: { SidePane },
})
export default class extends Vue {
  resourceId = this.$route.params.resourceId
  resource: RdfResource | null = null

  async mounted (): Promise<void> {
    // TODO: load resource
  }

  onCancel (): void {
    this.$router.push({ name: 'CubeDesigner' })
  }
}
</script>
