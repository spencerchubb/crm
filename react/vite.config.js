import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: './index.html',
        issue: './issue/index.html',
        labels: './labels/index.html',
        new_issue: './new_issue/index.html',
        project: './project/index.html',
      },
    },
  },
})
