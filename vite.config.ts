import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves a project site under /<repo>/, so the build needs a base path.
// In dev (and for non-Pages hosts) we keep "/" so assets resolve from root.
const base = process.env.GITHUB_PAGES ? '/vcardlab/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
})
