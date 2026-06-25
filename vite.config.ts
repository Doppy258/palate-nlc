import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the static build works on GitHub Pages, Vercel, Netlify,
// and when opened from a sub-path. Hash routing keeps deep links working.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  // Tailwind is handled by the Vite plugin above. Pin an inline (empty) PostCSS
  // config so Vite does not auto-load the root postcss.config.mjs, which belongs
  // to the separate Next.js landing page and references a plugin this app does
  // not install (@tailwindcss/postcss).
  css: { postcss: { plugins: [] } },
})
