<template>
  <div v-if="mapping && sourcesCollection && tableCollection" class="is-relative layout">
    <div class="columns">
      <div class="column is-6">
        <div class="is-flex is-align-items-center gap-1">
          <h3 class="title is-6 mb-0">
            Input CSVs
          </h3>
          <hydra-operation-button
            :operation="sourcesCollection.actions.create"
            :to="{ name: 'CSVUpload' }"
            data-testid="upload-source"
          />
        </div>
      </div>
      <div class="column is-1">
        <p class="has-text-centered">
          <o-icon icon="arrow-right" size="small" />
        </p>
      </div>
      <div class="column is-5">
        <div class="is-flex is-align-items-center gap-1">
          <h3 class="title is-6 mb-0">
            Output tables
          </h3>
          <hydra-operation-button
            :operation="tableCollection.actions.create"
            :to="{ name: 'TableCreate' }"
            :disabled="sources.length === 0"
            data-testid="create-table"
          />
        </div>
      </div>
    </div>

    <div v-if="sources.length > 0" class="sources">
      <csv-source-mapping
        v-for="(source, index) in sources"
        :key="source.id.value"
        :source="source"
        :is-first-source="index === 0"
        :table-collection="tableCollection"
        :tables="tables"
        @highlight-arrows="highlightArrows"
        @unhighlight-arrows="unhighlightArrows"
      />
    </div>
    <p v-else>
      You haven't uploaded any CSV file yet.
      <span v-if="sourcesCollection.actions.create">
        Do you want to
        <router-link :to="{ name: 'CSVUpload' }">
          upload one
        </router-link>?
      </span>
    </p>

    <svg class="arrows">
      <path
        v-for="columnMapping in columnMappings"
        :key="columnMapping.id.value"
        :data-arrow-id="columnMapping.id.value"
        class="arrow"
        :class="{ active: activeArrows.includes(columnMapping.id.value) }"
      />
    </svg>

    <router-view />
  </div>
  <loading-block v-else />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CsvSourceMapping from '@/components/CsvSourceMapping.vue'
import HydraOperationButton from '@/components/HydraOperationButton.vue'
import LoadingBlock from '@/components/LoadingBlock.vue'
import { Table, ColumnMapping } from '@cube-creator/model'
import { mapGetters, mapState } from 'vuex'

export default defineComponent({
  name: 'CSVMappingView',
  components: { CsvSourceMapping, HydraOperationButton, LoadingBlock },

  data (): { activeArrows: string[] } {
    return {
      activeArrows: [],
    }
  },

  async mounted (): Promise<void> {
    await this.$store.dispatch('project/fetchCSVMapping')

    // TODO: Cleanup when unmounting?
    window.onresize = () => {
      this.drawArrows()
    }
  },

  computed: {
    ...mapState('project', {
      mapping: 'csvMapping',
      sourcesCollection: 'sourcesCollection',
      tableCollection: 'tableCollection',
    }),
    ...mapGetters('project', {
      sources: 'sources',
      tables: 'tables',
    }),

    columnMappings (): ColumnMapping[] {
      return this.tables.flatMap((table: Table) => table.columnMappings)
    },
  },

  methods: {
    drawArrows (): void {
      this.$nextTick(() => {
        const offsetX = this.$el.getBoundingClientRect().x
        const offsetY = this.$el.getBoundingClientRect().y

        this.columnMappings.forEach((columnMapping) => {
          const targetId = columnMapping.id.value
          const arrowEl = this.$el.querySelector(`[data-arrow-id="${targetId}"]`)
          const sourceEl = this.$el.querySelector(`[data-arrow-target="${targetId}"]`)
          const targetEl = this.$el.querySelector(`[data-column-mapping-id="${targetId}"]`)

          if (!sourceEl || !targetEl || !arrowEl) return

          const sourceBox = sourceEl.getBoundingClientRect()
          const targetBox = targetEl.getBoundingClientRect()

          const path = `
            M ${(sourceBox.x + sourceBox.width / 2) - offsetX},${(sourceBox.y + sourceBox.height / 2) - offsetY}
            L ${targetBox.x - offsetX},${(targetBox.y + targetBox.height / 2) - offsetY}
          `
          arrowEl.setAttribute('d', path)
        })
      })
    },

    highlightArrows (ids: string[]): void {
      this.activeArrows.push(...ids)
    },

    unhighlightArrows (ids: string[]): void {
      this.activeArrows = this.activeArrows.filter((id) => !ids.includes(id))
    },
  },

  watch: {
    columnMappings: {
      handler () {
        this.drawArrows()
      },
      deep: true,
    },
  },
})
</script>

<style scoped>
.layout {
  max-width: 180rem;
}

.arrows {
  pointer-events: none;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
}

.arrow {
  fill: none;
  stroke-width: 1;
}

.arrow.active {
  stroke: grey;
}
</style>
