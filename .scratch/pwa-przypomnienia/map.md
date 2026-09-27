# Wayfinder: PWA i prawdziwe przypomnienia

Effort: `.scratch/pwa-przypomnienia/`
Tickets: `.scratch/pwa-przypomnienia/issues/`

## Destination

Dostarczać przypomnienia o kontrolach znamion **w tle** (nie tylko plikiem
`.ics`), na tyle niezawodnie, na ile pozwala darmowy, bezserwerowy stack
(GitHub Pages + Supabase).

## Ograniczenia (twarde)

- Hosting to **GitHub Pages** (statyczny) — nie ma własnego serwera aplikacji.
- Backend = **Supabase** (Postgres + Auth + Storage + Edge Functions + Cron).
- Platforma główna: **Chrome / Android**.
- Zasada: brak wysyłania danych wrażliwych do podmiotów trzecich bez decyzji.

## Decisions so far

- Przypomnienia generowane lokalnie jako **cykliczny `.ics`** (RRULE + alarm) —
  wdrożone (`src/lib/ics.js`, `CalendarReminderButton`). To działa i zostaje.
- Manifest PWA + ikony — wdrożone (`public/manifest.webmanifest`).

## Not yet specified (mgła)

- Czy wchodzimy w Web Push (nowa tabela + Edge Function + harmonogram), czy
  zostajemy przy lekkim wariancie (in-app + `.ics`).
- Kiedy pokazywać powiadomienie (dzień terminu? X dni przed — mamy
  `reminder_lead_days`).
- Jedno zbiorcze powiadomienie vs per znamię.

## Out of scope

- Płatne usługi / zewnętrzne serwery push (np. Firebase) — chyba że świadoma
  decyzja.
- Powiadomienia jako diagnoza/ocena — sprzeczne z ADR-0001.

## Tickets

| #  | Type     | Tytuł                                                              | Blocked by | Status |
| -- | -------- | ------------------------------------------------------------------ | ---------- | ------ |
| 01 | research | [Jak dostarczać przypomnienia w tle bez własnego serwera](issues/01-research-scheduling.md) | — | open |
| 02 | grilling | [Zakres: pełny Web Push vs wariant lekki](issues/02-grilling-zakres.md) | 01 | open |

## Frontier

Pierwszy otwarty: **01** (research).
