# Stan projektu — Skin Tracker

> Krótki, aktualizowany ręcznie przegląd. Ostatnia aktualizacja: **2026-09-29**.
> Szczegóły: `README.md` (jak uruchomić), `CONTEXT.md` (słownik domeny),
> `CHANGELOG.md` (historia wdrożeń), `.scratch/README.md` (indeks ticketów).

## Cel

Prywatna, fotograficzna dokumentacja znamion w czasie (u mnie i u syna) —
do porównywania, **nie do diagnostyki**. Jedno konto prowadzi jedną lub kilka
osób („Ja", „Syn").

## Stack

- React 18 + Vite 5 + Tailwind CSS v4
- Supabase (Postgres + Auth + Storage, darmowy tier)
- `HashRouter`, hosting GitHub Pages
- MediaPipe (pomiar z obrysu, lokalnie w przeglądarce), Recharts (wykres)
- Bez własnego serwera aplikacji.

## Jakość / stan repo

- `npm run build` ✓, `npm test` → **86/86** ✓ (jednostkowe).
- `npm run e2e` → **27/27** ✓ (Playwright, zmockowany Supabase, ~15 s),
  w tym **budżet UI** na 375×667 (`e2e/ui-budget.spec.js`).
- Tracker: **12 effortów, 80 ticketów (+1 spec): 75 `resolved`, 4 otwarte
  i 1 `wontfix` w `.scratch/backlog/`.

## Funkcje

| Obszar | Stan |
| --- | --- |
| **Telefon** | nagłówek ≤ 121 px (43% → 18% wysokości); komunikaty o instalacji na dole; panel przypomnień zwinięty; budżet UI pilnowany testem |
| **Wybór osoby** | karta z liczbami (znamiona, zdjęcia, najbliższa kontrola + „zaległe” gdy minęła); zmiana nazwy i usunięcie osoby w menu „⋯” |
| **Mapa ciała** | widoki ze słownika 17 okolic + własne nazwy; piny (dodaj / przesuń / edytuj); zdjęcie tła per widok (aparat lub plik); kontekst okolicy w nazwie znamienia; panel pina jako bottom sheet na telefonie |
| **Znamię** | zdjęcia z edycją (obrót / odbicia) i kompresją; pomiar z obrysu (MediaPipe, geometria); notatki ABCDE; status; porównanie przeciąganym suwakiem; wykres rozmiaru; powiększanie zdjęć (lightbox) |
| **Lista znamion** | filtr po statusie + sortowanie po terminie kontroli; stan w URL |
| **Kontrole** | terminy, przesuwanie, ustawienia; panel „Przypomnienia na telefon" (instalacja + zgoda + push ze statusem); **3 poziomy przypomnień**: `.ics`, in‑app, **Web Push w tle** |
| **PWA** | manifest + ikony, przycisk **„Zainstaluj"** (Android: prompt; iOS: instrukcja), service worker (obsługa push) |

## Automatyzacja (GitHub)

- **Deploy:** każdy push na `main` → build + publikacja na GitHub Pages.
- **Testy:** workflow „Testy" (`.github/workflows/e2e.yml`) — `npm test`
  (jednostkowe) + `npm run e2e` (Playwright). Bez sekretów: backend jest
  zamockowany. Uruchamiany na `push`/PR i ręcznie; nie blokuje deployu.
- **Przypomnienia:** workflow „Powiadomienia o kontrolach" — cron codziennie
  08:00 UTC (09:00 zimą / 10:00 latem, czasu PL) (+ ręczne „Run workflow").
  Nadawcą jest GitHub Actions (koszt 0).
  ⚠️ GitHub wyłącza zaplanowane workflow po ~60 dniach bezczynności repo — wtedy
  uruchom go raz ręcznie.

## Konfiguracja jednorazowa (po stronie właściciela)

1. Supabase → SQL Editor → uruchom **cały** `supabase/rls-setup.sql`
   (sekcje 7 i 8 dodają pola przypomnień oraz `push_subscriptions`).
2. Sekrety GitHub Actions:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`,
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. Na telefonie: **Kontrole → „Powiadomienia w tle"** (zgoda) oraz
   przycisk **„Zainstaluj"** (dodanie do ekranu początkowego).

## Otwarte / do rozważenia

Backlog żyje w **`.scratch/backlog/`**. Otwarte:

| #  | Temat | Status |
| -- | ----- | ------ |
| 01 | Eksport / kopia zapasowa danych | needs-triage |
| 04 | Testy wizualne w e2e (zrzuty; budżet już jest) | ready-for-agent |
| 05 | Audyt dostępności (a11y) | needs-triage |
| 09 | Nawigacja na telefonie: zostawić / dolny pasek / hamburger | needs-triage |

Zamknięte: 02 („Usunięte” nie jest już zaległe), 03 (szukanie w Kontrolach),
07 (znacznik przy „Kontrole” odświeża się sam), 08 (nagłówek na telefonie:
286 → 121 px). Odrzucone: 06 (`wontfix`).

Najważniejsze: **01** — jedyny realny sposób ochrony dorobku przed utratą
projektu Supabase.

### Sprawdzone — nie wracać

- **Web Push na wielu urządzeniach:** `enablePush()` zapisuje subskrypcję
  przez `upsert` po `endpoint`, a wysyłka sama usuwa wygasłe (`404`/`410`).
- **Treść powiadomień:** `scripts/send-reminders.mjs` już agreguje — jedno
  znamię z nazwą i terminem, kilka jako „N kontroli do wykonania — X
  zaległych”.
