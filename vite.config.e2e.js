import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.js'

// Config Vite uzywany WYLACZNIE przez testy e2e (patrz playwright.config.js).
//
// Rozni sie od produkcyjnego jednym: `envDir: false` nie wczytuje plikow .env.
// Bez tego Vite doladowalby `.env` z prawdziwym adresem projektu Supabase i
// testy moglyby (przez pomylke) pisac do prawdziwej bazy. Tutaj konfiguracje
// dostarcza Playwright przez zmienne procesu (VITE_SUPABASE_URL wskazuje na
// `https://e2e.invalid`, ktore w calosci przechwytuje mock).
export default mergeConfig(
  base,
  defineConfig({
    envDir: false,
  })
)
