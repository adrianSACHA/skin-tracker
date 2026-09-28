# Wayfinder: Testy e2e (smoke)

Effort: .scratch/e2e-smoke-testy/
Tickets: .scratch/e2e-smoke-testy/issues/

## Destination

Krótka, tania paczka testów **e2e** („dymnych”), która w prawdziwej przeglądarce
klika najważniejsze ścieżki aplikacji: logowanie, wybór/edycja osoby, mapa
ciała, lista znamion z filtrami, motyw, układ na telefonie.

Cel nie jest „pełne pokrycie UI”, tylko: wyłapywanie regresji po refaktorach
(i) oraz bezpieczne zmiany w nawigacji/komponentach.

## Decisions so far

- **Backend zamockowany, nie prawdziwy.** Zapytania do Supabase przechwytuje
  `e2e/support/mock-supabase.js` (`page.route`). Testy nie potrzebują bazy,
  konta ani internetu, a CI nie potrzebuje żadnych sekretów.
- **Adres `https://e2e.invalid`.** Domena `.invalid` jest zarezerwowana i
  nierozwiązywalna — nawet gdyby mock przestał łapać zapytanie, połączenie się
  nie uda. (ticket 01)
- **Osobny config Vite z `envDir: false`** (`vite.config.e2e.js`), żeby Vite nie
  doczytał `.env` z prawdziwym projektem Supabase. Konfigurację podaje
  Playwright przez zmienne procesu. (ticket 01)
- **Logowanie przez UI w każdym teście**, nie przez wstrzykiwanie sesji do
  `localStorage` — mniej sprzężenia z wewnętrznym formatem supabase-js.
- **Jedna przeglądarka (Chromium), jeden projekt.** Wariant „telefon 375×667”
  to zwykły `test.use({ viewport })` w jednym pliku, a nie osobny projekt —
  nie podwaja czasu przebiegu. (ticket 02)
- **Nie używamy `locator.check()`** na filtrach listy: React Router v7
  aktualizuje adres w `startTransition`, więc DOM nie zmienia się
  synchronicznie i `check()` zgłasza „stan się nie zmienił”. Zamiast tego
  `click()` + asercja (URL / `toBeChecked()`), która czeka. (ticket 02)
- Testy e2e uruchamiają się także w istniejącym workflow CI (razem z
  jednostkowymi). (ticket 03)
- **Osobne pliki konfiguracyjne runnerów** (`vitest.config.js` dla
  jednostkowych, `playwright.config.js` dla e2e). Domyslny wzorzec Vitesta
  łapie `*.spec.js`, więc bez tego Vitest próbował uruchamiać testy
  Playwrighta i czerwienił się na 5 plikach. (ticket 02)

## Not yet specified (mgła)

- Testy z prawdziwym (lokalnym) Supabase — czy warto, czy mock wystarczy.
- Testy wizualne (porównywanie zrzutów ekranu) — naturalne rozszerzenie,
  ale najpierw stabilność.
- Ścieżka „Zrób zdjęcie” (aparat) — niewiele da się zasymulować; zostaje
  ręcznie.
- Segmentator (MediaPipe) — ciężki i wolny, pomijamy w e2e.
- Wgranie zdjęcia z pliku (`setInputFiles`) — możliwe, jeszcze nie objęte.

## Out of scope

- Przepisywanie istniejących testów jednostkowych (Vitest) — zostają.
- Zastępowanie testów ręcznych na prawdziwym telefonie.

## Tickets

| #  | Type | Tytuł | Blocked by | Status |
| -- | ---- | ----- | ---------- | ------ |
| 01 | task | [Playwright + mock Supabase + osobny config Vite](issues/01-harness.md) | — | resolved |
| 02 | task | [Scenariusze smoke (18 testów)](issues/02-scenariusze.md) | 01 | resolved |
| 03 | task | [Workflow CI (jednostkowe + e2e)](issues/03-ci.md) | 01, 02 | resolved |

## Frontier

Brak — wszystkie 3 tickety **resolved**. Łącznie **18 testów e2e** (przebieg
~7 s) obok 69 testów jednostkowych.
