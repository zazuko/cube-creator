<template>
  <div v-html="rendered" />
</template>

<script lang="ts">
import MarkdownIt from 'markdown-it'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'MarkdownRender',
  props: {
    source: {
      type: String,
      default: '',
    },
    anchorAttributes: {
      type: Object,
      default: () => ({})
    },
  },

  setup () {
    const md = ref(new MarkdownIt())

    return {
      md,
    }
  },

  created () {
    const defaultLinkRenderer = this.md.renderer.rules.link_open ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
      }

    this.md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      Object.keys(this.anchorAttributes).forEach((attribute) => {
        const aIndex = tokens[idx].attrIndex(attribute)
        const value = this.anchorAttributes[attribute]
        const token = tokens[idx]

        if (aIndex < 0) {
          token.attrPush([attribute, value]) // add new attribute
        } else {
          if (token.attrs) {
            token.attrs[aIndex][1] = value
          }
        }
      })
      return defaultLinkRenderer(tokens, idx, options, env, self)
    }
  },

  computed: {
    rendered () {
      return this.md.render(this.source)
    },
  },
})
</script>
