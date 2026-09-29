# 07 — Znacznik przy „Kontrole” nie odświeżał się po zmianie danych

Type: task
Status: resolved
Map: .scratch/backlog/map.md

## Problem

`useDueReminders(personId)` przeliczał liczby tylko przy zmianie **osoby** albo
**interwału**. `Layout` (w którym siedzi znacznik) jest zamontowany raz i
przetrwa zmiany ekranów, więc po edycji danych znacznik pokazywał starą liczbę
aż do przeładowania aplikacji.

Dotyczyło to każdej zmiany wpływającej na termin kontroli:

- zmiana statusu znamienia (panel pina, szczegóły znamienia),
- dodanie / usunięcie znamienia,
- dodanie / usunięcie zdjęcia (zmienia „ostatnie zdjęcie”, a więc i termin),
- przesunięcie terminu na Kontrolach.

Najbardziej widoczny przypadek: na Kontrolach przesuwasz termin, licznik
„Zaległe” na stronie spada do zera, a znacznik w nagłówku dalej pokazuje starą
liczbę — dwa sprzeczne sygnały o tym samym.

Znalazłem to przy okazji ticketu 02, dlatego ticket 02 sprawdzał znacznik po
`page.reload()`.

## Answer

Nowy, cienki sygnał `src/lib/dueSignal.js` (`notifyDueChanged` /
`subscribeDueChanged`) — celowo **nie** magazyn danych, tylko dzwonek:
„dane, z których liczą się terminy, się zmieniły”.

`useDueReminders` przelicza teraz, gdy:

1. zmieni się osoba albo interwał,
2. przyjdzie sygnał (`notifyDueChanged()`),
3. zmieni się **ekran** (`useLocation().pathname`) — naturalny moment, w którym
   znacznik znów jest istotny,
4. aplikacja **wróci na wierzch** (`focus` / `visibilitychange`) — np. po
   zrobieniu zdjęcia aparatem.

Punkty 3 i 4 to siatka bezpieczeństwa: nawet gdyby jakieś miejsce zapisu
zapomniało zawołać sygnał, znacznik nie zostanie ze starą liczbą na dłużej
(kosztem jednego małego zapytania przy nawigacji).

Sygnał wołany jest z 10 miejsc, które zmieniają dane w trakcie **pozostawania na
tym samym ekranie** (tam punkty 3/4 nie pomogą):

- `BodyMap`: dodanie znamienia, zmiana statusu z panelu, edycja znamienia,
  usunięcie widoku (razem z jego znamionami),
- `LesionDetail`: zmiana statusu, usunięcie znamienia, usunięcie zdjęcia,
- `PhotoUploadForm`: dodanie zdjęcia,
- `Reminders`: przesunięcie i przywrócenie terminu.

Testy: 1 jednostkowy na `dueSignal` (bezpieczeństwo poza przeglądarką) + 2 e2e,
które **nie nawigują ani nie przeładowują** strony:

- zmiana statusu z panelu pina → znacznik znika sam,
- przesunięcie terminu na Kontrolach → „Zaległe: 1” → „Zaległe: 0” i znacznik
  znika.

Sprawdzone mutacją: po wyłączeniu `notifyDueChanged()` padają dokładnie te dwa
testy (pozostałe przechodzą, bo korzystają z nawigacji) — czyli pokrycie jest
precyzyjne.

Przy okazji: test ticketu 02 nie potrzebuje już `page.reload()`.
