import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/WildRealms_Biome_Simulator/',
  plugins: [react()],
})