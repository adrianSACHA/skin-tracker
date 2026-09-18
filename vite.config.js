import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// WAŻNE dla GitHub Pages:
// `base` musi być nazwą repozytorium poprzedzoną i zakończoną slashem.
// Repo: https://github.com/adrianSACHA/skin-tracker
// Strona: https://adrianSACHA.github.io/skin-tracker/
export default defineConfig({
  base: '/skin-tracker/',
  plugins: [react(), tailwindcss()],
})
