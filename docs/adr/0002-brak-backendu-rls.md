# Brak backendu: Supabase + RLS jako granica bezpieczeństwa

Skin Tracker nie ma własnego backendu — frontend (React + Vite) rozmawia wprost z Supabase (Postgres + Auth + Storage), a `anon` key jest jawny w publicznym buildzie. Bezpieczeństwo opiera się **wyłącznie na Row Level Security**, nie na ukryciu strony ani klucza; każda polityka sprowadza się do łańcucha `… → osoba → konto (auth.uid())`, a bucket Storage jest prywatny (dostęp tylko przez signed URL).

## Considered Options

- **Własny backend / funkcje serverless** (np. Netlify/Vercel Functions) trzymające klucz po stronie serwera — odrzucone: dodatkowy koszt i utrzymanie bez realnej korzyści dla jednoosobowej aplikacji; RLS daje ten sam efekt.
- **Frontend-only + RLS** — wybrane.

## Consequences

- Kod frontendu jest z założenia jawny: nie wolno opierać bezpieczeństwa na tajności adresu ani klucza.
- Klucz `service_role` nigdy nie może trafić do frontendu — tylko `anon` z włączonym RLS.
