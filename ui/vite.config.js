import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import htmlTemplate from 'vite-plugin-html-template'
import path from 'node:path'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    vue(),
    htmlTemplate.default(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(),
      ],
    },
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: [
      {
        find: /^@\/(.*)/,
        replacement: path.resolve(__dirname, './src/$1'),
      },
      {
        // this is required for the SCSS modules
        find: /^~(.*)$/,
        replacement: '$1',
      },
    ],
  }
})
