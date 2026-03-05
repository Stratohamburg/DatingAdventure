import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages 部署配置
  base: '/DatingAdventure/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
      '@store': path.resolve(__dirname, './src/store'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})
