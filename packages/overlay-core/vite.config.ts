import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AIOverlayBundle',
      formats: ['es', 'iife'],
      fileName: (format) => (format === 'es' ? 'overlay.js' : 'overlay.global.js'),
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
})
