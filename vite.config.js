import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Climio/', // 👈 Usa el nombre exacto de tu repositorio
})