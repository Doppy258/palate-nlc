import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the static build works on GitHub Pages, Vercel, Netlify,
// and when opened from a sub-path. Hash routing keeps deep links working.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
