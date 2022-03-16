<template>
  <div class="quickview" :class="{ 'is-active': isOpen }" :style="width ? { width: width } : {}">
    <div @mousedown="onMouseDown" class="handle" />
    <div class="quickview-inner">
      <header class="quickview-header">
        <h2>{{ title }}</h2>
        <button class="delete" @click="$emit('close')" />
      </header>

      <div class="quickview-body">
        <slot />
      </div>
      <!-- <footer class="quickview-footer"></footer> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import 'bulma-quickview/dist/css/bulma-quickview.min.css'

export default defineComponent({
  name: 'SidePane',
  props: {
    isOpen: {
      type: Boolean,
      default: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  emits: ['close'],

  data (): { width: string | null } {
    return {
      width: null,
    }
  },

  methods: {
    onMouseDown (): void {
      const containerWidth = window.innerWidth

      const onMouseMove = ({ pageX }: MouseEvent) => {
        this.width = `${containerWidth - pageX}px`
      }

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
  },
})
</script>

<style scoped>
.quickview {
  transition: none;

  flex-direction: row;
}

.handle {
  width: 3px;
  margin-right: -3px;
  cursor: col-resize;
  z-index: 10;
}

.quickview-inner {
  flex-grow: 1;
  overflow: auto;

  display: flex;
  flex-direction: column;
}

.quickview-body {
  padding: 1rem;
}
</style>
