# 02 — Zakres: pełny Web Push vs wariant lekki

Type: grilling
Status: open
Blocked by: 01
Map: .scratch/pwa-przypomnienia/map.md

## Pytanie

Którą drogę wybieramy dla przypomnień?

## Opcje

### A — Pełny Web Push („prawdziwe" w tle)
Telefon dostaje powiadomienie nawet przy zamkniętej aplikacji.
Wymaga (jednorazowo):
- kluczy **VAPID** (para kluczy; publiczny w frontendzie),
- nowej tabeli **`push_subscriptions`** (RLS: właściciel konta),
- **service workera** z handlerem `push` + obsługą `notificationclick`,
- **Supabase Edge Function** + harmonogram (Cron), który raz dziennie sprawdza
  `lesions.next_check_at` / `reminder_lead_days` i wysyła push,
- zgody użytkownika (`Notification.requestPermission`) i UI „włącz przypomnienia".
Minusy: więcej ruchomych części, subskrypcje wygasają (trzeba odświeżać),
zależy od usługi push przeglądarki (Android/Chrome ok).

### B — Wariant lekki (bez infra)
- **In-app**: licznik zaległych/„w ciągu 30 dni" w nawigacji + wyróżnienie,
- **`new Notification()`** przy otwarciu aplikacji, gdy coś jest zaległe
  (opcjonalnie za zgodą),
- zostaje **`.ics`** do kalendarza (jak dziś).
Plusy: zero nowej infra, wdraża się od razu. Minusy: nie obudzi telefonu, gdy
aplikacja zamknięta.

### C — A + B razem
Lekki wariant teraz, Web Push jako krok 2 (gdy zatwierdzisz infra).

## Rekomendacja (wstępna)

**C**: najpierw B (natychmiastowa wartość, zero ryzyka), potem A jako osobny
krok po akceptacji nowej tabeli i Edge Function.

## Answer

_(uzupełniane przy rozwiązywaniu)_
