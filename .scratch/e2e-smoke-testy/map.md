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

- **Zrzuty ekranu — zrobione (ticket 04).** Baseline **per-platforma**
  (`-win32.png` / `-linux.png`, bo Playwright dokleja `process.platform`) —
  dzięki temu zestaw jest zielony lokalnie na Windowsie i w CI na Linuksie,
  bez Dockera. Czas **zamrożony** (`page.clock.setFixedTime`), bo ekrany
  pokazują terminy liczone od „dzisiaj”. Tolerancja `maxDiffPixelRatio: 0.01`.
  Brakujący wzorzec Playwright zapisuje, więc CI samo tworzy linuxowe
  (artefakt `baseline-linux` do zacommitowania). 8 wzorców, w tym tryb
  ciemny. Szczegóły: `issues/04-zrzuty-ekranu.md`.
- **Niestabilny test zoomu — naprawiony (ticket 05).** `zoomIn()` mnoży od
  bieżącej skali, a test asertował dokładne `scale(1.5` — przy trafieniu w
  trwającą animację wychodziło `1.65` (~1 czerwony na 3 przebiegi). Teraz
  jedno kliknięcie + czekanie na koniec animacji + asercja „skala > 1”.
  Szczegóły: `issues/05-niestabilny-zoom.md`.

## Not yet specified (mgła)

- Testy z prawdziwym (lokalnym) Supabase — czy warto, czy mock wystarczy.
- Porównywanie zrzutów **na Linuksie** działa od momentu zacommitowania
  linuxowych wzorców z artefaktu `baseline-linux` (patrz ticket 04). Do tego
  czasu CI jest zielone, ale nie porównuje niczego na Linuksie.
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
| 04 | task | [Zrzuty ekranu (regresje wyglądu)](issues/04-zrzuty-ekranu.md) | 02 | resolved |
| 05 | task | [Niestabilny test gestu zoomu](issues/05-niestabilny-zoom.md) | — | resolved |

## Frontier

Brak otwartych ticketów. Łącznie **38 testów e2e** (30 zachowania + 8 zrzutów
ekranu; przebieg ~20 s) obok 101 testów jednostkowych.

Poza trackerem, do dokończenia: zebrać linuxowe wzorce z artefaktu
`baseline-linux` pierwszego przebiegu w CI i zacommitować je (patrz ticket 04).
