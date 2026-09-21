# Przypomnienia generowane w przeglądarce (`.ics`), bez serwera

Kontrole nie mają backendowego schedulera ani powiadomień push. Przypomnienie to cykliczne wydarzenie `.ics` (RRULE + alarm) generowane lokalnie w przeglądarce i eksportowane do kalendarza (`.ics` / Google / Outlook).

## Considered Options

- **Powiadomienia push / e-mail z serwera** (np. Supabase Edge Functions + cron) — odrzucone: wymaga backendu, harmonogramu i zgód, nieproporcjonalne do jednoosobowego użycia.
- **Cykliczny `.ics` generowany w przeglądarce** — wybrane: zero kosztów, zero backendu.

## Consequences

- Przypomnienie żyje w kalendarzu użytkownika, nie w aplikacji — aplikacja nie „wie", czy użytkownik je zobaczył.
