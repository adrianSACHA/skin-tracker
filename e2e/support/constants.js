// Wspolne stale dla testow e2e - JEDNO zrodlo prawdy.
// Uzywaja ich: playwright.config.js (webServer + baseURL), e2e/support/*.

// Celowo domena `.invalid` (zarezerwowana, nierozwiazywalna): kazde zapytanie
// do niej jest przechwytywane przez mock, a gdyby mock zawiodl - polaczenie
// i tak sie nie uda. Prawdziwy projekt Supabase nie jest uzywany nigdy.
export const SUPABASE_URL = 'https://e2e.invalid'
export const SUPABASE_ANON_KEY = 'e2e-anon-public-key'

export const PORT = 5199

// Musi byc zgodne z `base` w vite.config.js (GitHub Pages podkatalog).
export const BASE_PATH = '/skin-tracker/'

export const BASE_URL = `http://localhost:${PORT}`
export const APP_URL = BASE_URL + BASE_PATH
