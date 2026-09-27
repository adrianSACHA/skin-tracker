# Stan projektu — Skin Tracker

> Krótki, aktualizowany ręcznie przegląd. Ostatnia aktualizacja: **2026-09-27**.
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

- `npm run build` ✓, `npm test` → **64/64** ✓.
- Gałąź `main` zsynchronizowana z `origin/main`, working tree czysty.
- Tracker: **7 effortów, 51 ticketów (+1 spec) — wszystkie `resolved`**.

## Funkcje

| Obszar | Stan |
| --- | --- |
| **Mapa ciała** | widoki ze słownika 17 okolic + własne nazwy; piny (dodaj / przesuń / edytuj); zdjęcie tła per widok (aparat lub plik); kontekst okolicy w nazwie znamienia; panel pina jako bottom sheet na telefonie |
| **Znamię** | zdjęcia z edycją (obrót / odbicia) i kompresją; pomiar z obrysu (MediaPipe, geometria); notatki ABCDE; status; porównanie przeciąganym suwakiem; wykres rozmiaru; powiększanie zdjęć (lightbox) |
| **Lista znamion** | filtr po statusie + sortowanie po terminie kontroli; stan w URL |
| **Kontrole** | terminy, przesuwanie, ustawienia; **3 poziomy przypomnień**: `.ics` (kalendarz), in‑app (licznik + powiadomienie przy otwarciu), **Web Push w tle** |
| **PWA** | manifest + ikony, przycisk **„Zainstaluj"** (Android: prompt; iOS: instrukcja), service worker (obsługa push) |

## Automatyzacja (GitHub)

- **Deploy:** każdy push na `main` → build + publikacja na GitHub Pages.
- **Przypomnienia:** workflow „Powiadomienia o kontrolach" — cron codziennie
  06:00 UTC (+ ręczne „Run workflow"). Nadawcą jest GitHub Actions (koszt 0).
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

- Wyszukiwanie znamion po nazwie (na liście).
- Web Push dla wielu urządzeń (deduplikacja subskrypcji).
- Dalsze drobiazgi UX (przegląd pozostałych widoków na telefonie).
