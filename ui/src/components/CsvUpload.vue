<template>
  <div class="input-sources">
    <div class="level">
      <div class="level-left">
        <b-upload @input="uploadSource" accept=".csv" class="level-item">
          <a class="button is-primary">
            <b-icon icon="upload" />
            <span>Upload source CSV file</span>
          </a>
        </b-upload>
      </div>
      <div class="level-right" />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
export default Vue.extend({
  name: 'CsvUpload',
  data () {
    return {
      project: {}
    }
  },
  methods: {
    async uploadSource (file) {
      const loading = this.$buefy.loading.open({})
      try {
        await this.$store.dispatch('sources/upload', { project: this.project, file })
      } finally {
        loading.close()
      }
    }
  }
})
</script>
