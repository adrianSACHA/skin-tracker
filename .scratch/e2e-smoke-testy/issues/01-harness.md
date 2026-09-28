# 01 — Playwright + mock Supabase + osobny config Vite

Type: task
Status: resolved
Map: .scratch/e2e-smoke-testy/map.md

## Problem

Nie ma żadnych testów e2e — każda zmiana w nawigacji czy komponencie jest
sprawdzana ręcznie. Do tego aplikacja wymaga Supabase, więc „uruchom aplikację
i poklikaj” wymagałoby prawdziwej bazy i konta (albo ryzyka pisania do
prawdziwych danych).

## Do decyzji

- Mock w przeglądarce (`page.route`) czy prawdziwy lokalny Supabase?
- Jak dostarczyć konfigurację, skoro `.env` (z prawdziwym projektem) istnieje
  i jest wczytywany domyślnie?

## Answer

**Decyzja: mock w przeglądarce + własny adres `https://e2e.invalid`.**

Zrealizowane:

- `@playwright/test` (devDependency), `playwright.config.js` — `testDir: ./e2e`,
  `webServer` startuje Vite i czeka na `http://localhost:5199/skin-tracker/`.
- `e2e/support/constants.js` — jedno źródło prawdy (adres mocka, port, ścieżka
  `base`). Używają go i config Playwrighta, i mock.
- `e2e/support/mock-supabase.js` — `mockSupabase(page, { data, loginFails })`.
  Obsługuje `/auth/v1/*`, `/rest/v1/*` (GET/POST/PATCH/DELETE z filtrami
  `eq.*`, rozróżnienie „obiekt vs lista” po nagłówku `Accept`), `/storage/v1/*`.
  Stan „bazy” jest mutowalny, więc test dodania/zmiany/usunięcia działa
  end-to-end, łącznie z kaskadą przy usunięciu osoby.
- `vite.config.e2e.js` — `mergeConfig` z produkcyjnym + **`envDir: false`**, żeby
  Vite nie wczytał `.env`. Zmienne podaje Playwright (`webServer.env`).
- `npm run dev:e2e` — start Vite z tym configiem.

Dlaczego `.env.e2e` nie powstał: tworzenie plików `.env*` jest zablokowane
(względy bezpieczeństwa). Config z `envDir: false` jest równie szczelny i nie
wymaga trzymania kolejnego pliku.

Weryfikacja: po starcie `dev:e2e` transformowany `src/lib/supabase.js` zawiera
`import.meta.env` = `{ ..., VITE_SUPABASE_URL: "https://e2e.invalid" }` —
prawdziwy adres projektu nie występuje.
