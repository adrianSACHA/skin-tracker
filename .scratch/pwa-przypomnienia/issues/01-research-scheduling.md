# 01 — Jak dostarczać przypomnienia w tle bez własnego serwera

Type: research
Status: resolved
Map: .scratch/pwa-przypomnienia/map.md

## Pytanie

Jakie są realne opcje dostarczania przypomnień o kontrolach w przeglądarce
Chrome/Android (PWA, zainstalowana), przy hostingu statycznym (GitHub Pages) i
backendzie Supabase — bez własnego serwera aplikacji?

## Ustalenia (na podstawie wiedzy o platformie)

| Mechanizm | Działa bez serwera? | Niezawodność | Werdykt |
| --- | --- | --- | --- |
| **Notification Triggers** (`showTrigger` / `TimestampTrigger`) | tak (lokalnie) | — | ✗ **Niedostępne** — nie trafiło do stabilnego Chrome i zostało usunięte/porzucone; nie ma go w obecnych przeglądarkach. |
| **Service Worker `setTimeout`** | tak | bardzo niska | ✗ SW jest usypiany, gdy bezczynny; timery nie przetrwają. |
| **Periodic Background Sync** | tak (w zainstalowanej PWA) | niska | ✗ Silnie ograniczone: interwał rzędu ~12–24 h, zależne od „zaangażowania" witryny, bez precyzji i bez gwarancji uruchomienia. |
| **Web Push** (Push API + VAPID) | **nie** (potrzebny *nadawca*) | wysoka | ✓ **Jedyna wiarygodna droga w tle.** Nadawcą może być Supabase Edge Function + harmonogram (Cron). |
| **Lokalne `new Notification()`** | tak | tylko gdy aplikacja otwarta | ✓ Lekkie: dobre na „przypomnienie przy wejściu". |
| **`.ics` (kalendarz urządzenia)** | tak | wysoka | ✓ Już mamy; niezależne od aplikacji, ale poza nią. |

### Wniosek

- „Prawdziwe" przypomnienie w tle (aplikacja zamknięta) **wymaga nadawcy**.
  Bez własnego serwera jedyne sensowne źródło to **Supabase Edge Function +
  harmonogram**, który wysyła Web Push do zapisanych subskrypcji.
- Wariant bez infra (drop-in): `.ics` (mamy) + **in-app** (licznik zaległych +
  opcjonalne powiadomienie przy otwarciu) — tanie, ale nie obudzi telefonu.

## Do rozstrzygnięcia w 02 (grilling)

Zakres: pełny Web Push (nowa tabela `push_subscriptions`, service worker
`push`, Edge Function + Cron, klucze VAPID) vs wariant lekki (in-app + `.ics`).

## Answer

Rozpoznanie domknięte — warianty w tabeli powyżej. Kluczowy wniosek: „prawdziwe"
przypomnienie w tle wymaga nadawcy (u nas Supabase Edge Function + Cron); bez
infra zostaje wariant lekki (in-app + `.ics`). Decyzję o zakresie podjęto w
ticketcie 02.
