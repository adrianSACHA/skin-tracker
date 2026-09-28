import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Konfiguracja TYLKO dla testow jednostkowych (Vitest).
//
// Powod istnienia osobnego pliku: katalog `e2e/` zawiera pliki `*.spec.js`,
// ktore domyslny wzorzec Vitesta lapalby i probowal uruchomic (a one wymagaja
// runnera Playwrighta). Tutaj jawnie ograniczamy sie do `src/`.
//
// Testy e2e uruchamia Playwright: `npm run e2e` (patrz playwright.config.js).
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
