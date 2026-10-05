import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://srinivasaphanindra.github.io/northstar-agents/app/
export default defineConfig({
  plugins: [react()],
  base: '/northstar-agents/app/',
})
