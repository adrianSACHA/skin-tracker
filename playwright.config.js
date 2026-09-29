import { defineConfig } from '@playwright/test'
import {
  APP_URL,
  BASE_URL,
  BASE_PATH,
  PORT,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from './e2e/support/constants.js'

// Testy e2e („dymne"): uruchamiaja prawdziwa aplikacje w przegladarce, ale
// backend Supabase jest zamockowany w `e2e/support/mock-supabase.js` - zadnej
// bazy ani konta nie potrzeba.
//
// Uruchamianie:
//   npm run e2e          - wszystkie testy (headless)
//   npm run e2e:ui       - tryb interaktywny (podglad, time-travel)
//   npm run e2e:report   - raport HTML z ostatniego przebiegu
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: {
    timeout: 8_000,
    // Zrzuty ekranu (e2e/visual): tolerancja na drobny szum antyaliasingu,
    // ale nie na realna zmiane ukladu. Animacje wylaczone = determinizm.
    // Baseline jest per-platforma (Playwright dokleja process.platform),
    // wiec Windows i Linux maja wlasne pliki wzorcowe.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

  webServer: {
    // Osobny config Vite: `envDir: false` + adres Supabase z procesu,
    // zeby prawdziwy projekt nie byl czytany ani uzywany.
    command: `npm run dev:e2e -- --port ${PORT} --strictPort`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_SUPABASE_URL: SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
    },
  },
})

export { BASE_PATH }
