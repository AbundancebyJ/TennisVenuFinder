import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 등 하위 경로 배포 시 BASE_PATH 지정 (예: /TennisVenuFinder/)
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
})
