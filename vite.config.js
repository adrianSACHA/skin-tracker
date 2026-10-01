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
  build: {
    rollupOptions: {
      output: {
        // Domyślnie cały vendor wpadał do jednego pliku (>500 kB), więc Vite
        // ostrzegał. Rozbicie na osobne chunki daje mniejsze pliki (lepsze
        // cache i równoległe pobieranie) i zdejmuje ostrzeżenie. Ciężkie,
        // rzadko używane biblioteki (Recharts, MediaPipe) i tak ładują się
        // leniwie — mają własne chunki.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
