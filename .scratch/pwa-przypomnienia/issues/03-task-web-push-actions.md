# 03 — Web Push przez GitHub Actions (bez płatnych funkcji)

Type: task
Status: resolved
Map: .scratch/pwa-przypomnienia/map.md

## Co dostarcza

Prawdziwe powiadomienia w tle (aplikacja zamknięta) bez własnego serwera i bez
płatnych funkcji Supabase — nadawcą jest GitHub Actions.

## Zakres (wdrożone)

- **Frontend:** rejestracja `public/sw.js` (`src/main.jsx` + `src/lib/push.js`),
  subskrypcja Web Push (VAPID) i zapis do `push_subscriptions`.
- **UI:** przełącznik „Powiadomienia w tle" w Kontrolach (`Reminders.jsx`).
- **Sync interwału:** `useIntervalWeeks(personId)` zapisuje `interval_weeks` do
  `monitored_persons` (nadawca liczy termin serwerowo).
- **Nadawca:** `scripts/send-reminders.mjs` (web-push + supabase service_role).
- **CI:** `.github/workflows/notify.yml` (cron + `workflow_dispatch`).
- **SQL:** sekcja 8 — `interval_weeks`, `last_reminded_at`, `push_subscriptions` + RLS.
- **Env:** `VITE_VAPID_PUBLIC_KEY` w `env.example` i w `deploy.yml`.

## Kryteria akceptacji

- [x] Build + testy zielone; `node --check scripts/send-reminders.mjs` ok.
- [x] Skrypt bez sekretów kończy się czytelnym błędem (nie wywala CI losowo).
- [x] Subskrypcje wygasłe (404/410) są sprzątane przy wysyłce.
- [x] Dedup: `last_reminded_at` blokuje powtórki w tym samym cyklu.

## Do zrobienia po stronie użytkownika (checklista)

1. `npx web-push generate-vapid-keys`.
2. Sekrety repo: `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Re-run `supabase/rls-setup.sql`.
4. Włączyć „Powiadomienia w tle" w Kontrole.

## Answer

Zrealizowane. Koszt: 0 (GitHub Actions + darmowy Postgres). Uwaga: GitHub wyłącza
zaplanowane workflow po ~60 dniach bezczynności repo.
