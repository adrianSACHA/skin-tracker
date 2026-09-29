# 11 — Wysyłka przypomnień: nie widać, czy coś poszło (+ tryb testowy)

Type: task
Status: resolved
Map: .scratch/backlog/map.md

## Problem

Skrypt `scripts/send-reminders.mjs` kończy się **zawsze kodem 0**, także gdy nie
wysłał niczego. Log ma linię `Gotowe. Wysłano powiadomień: N.`, ale:

- log trzeba otworzyć w GitHubie i przeklikać się przez kroki,
- zielony ✅ na liście przebiegów **sugeruje, że powiadomienie poszło** — a to
  nieprawda.

W efekcie pytanie „czy dziś poszło?” wymaga ręcznego grzebania, a różnica między
„nie wysłano, bo nic nie było do wysłania” a „nie wysłano, bo coś się zepsuło”
jest niewidoczna. Da się też trafić w taki moment cyklu, że nie da się
zweryfikować pushu bez czekania do następnego terminu.

Stan faktyczny z 2026-09-29 (dla kontekstu, nie do kodu!): subskrypcja istnieje
(jeden endpoint w `push_subscriptions`), przebieg ręczny i zaplanowany kończyły
się ✅ — ale liczba wysłanych pozostaje do sprawdzenia w logu.

## Co jest OK i czego NIE zmieniać

**Raz dziennie wystarczy** — taka jest decyzja właściciela. Nie zwiększamy
częstotliwości i nie dokładamy drugiego crona. `last_reminded_at` (jedno
przypomnienie na cykl kontroli) działa zgodnie z projektem i **zostaje**.

## Propozycja

1. **Widoczny wynik bez czytania logu.** Na koniec wypisać podsumowanie do
   **step summary** (`$GITHUB_STEP_SUMMARY`): ile wysłano, ile osób/urządzeń,
   ile pominięto i **dlaczego** (np. „2 znamiona, żadne nie w terminie; 1 już
   przypomniane w tym cyklu”). Wtedy widać to na stronie przebiegu, bez
   schodzenia w log.
   - Do rozważenia: jeśli wysłano 0, **nie** kończyć błędem (to normalny stan),
     ale dać wyraźny nagłówek „Nic do wysłania”.
2. **Tryb testowy** — nowe wejście `workflow_dispatch`: `force` (checkbox/pole).
   W tym trybie:
   - wysyłka **ignoruje** `remindOn` i `last_reminded_at` (wysyła do wszystkich
     subskrypcji właściciela, z treścią „to jest próba”),
   - **NIE zapisuje** `last_reminded_at` — próba nie może „zużyć” prawdziwego
     cyklu (to jest błąd, który łatwo popełnić i przez który użytkownik nie
     dostanie prawdziwego przypomnienia).
   - Powód: pozwala sprawdzić push w 10 sekund po zmianie kluczy/instalacji,
     zamiast czekać do następnego terminu.
3. **Diagnostyka nieudanych wysyłek.** Teraz nieudane wysyłki lądują w
   `console.error` (czyli tylko w logu). Przy podsumowaniu wypisać liczbę
   nieudanych oraz — gdy wszystkie padły — wprost podpowiedź, że subskrypcja
   mogła wygasnąć albo klucze VAPID zostały zmienione (zmiana pary kluczy
   unieważnia wszystkie istniejące subskrypcje).

## Kryteria akceptacji

- Po przebiegu widać na stronie runu, **ile wysłano i dlaczego nic nie poszło**,
  bez wchodzenia w log.
- `force` wysyła na żądanie i **nie psuje** cyklu (`last_reminded_at` bez zmian).
- Zwykły przebieg bez niczego w terminie dalej kończy się ✅ (to nie błąd).
- Test: przebieg w trybie `force` na mocku/na sucho nie zapisuje
  `last_reminded_at` (jeśli da się to sensownie sprawdzić; w przeciwnym razie
  przynajmniej komentarz w kodzie i sprawdzenie ręczne).

## Answer

Zrealizowane. Logika terminów wyszła ze skryptu do **`src/lib/reminders.js`**
(czyste funkcje, 15 testów w `src/lib/reminders.test.js`) — wcześniej była
drugą kopią tego, co robi aplikacja, i nie dało się jej przetestować.
Termin liczy teraz ten sam `dueRows()`, co Kontrole. Skrypt został sprowadzony
do I/O: baza, wysyłka, raport.

**1. Widać, ile wysłano i dlaczego nic nie poszło.** Skrypt pisze
podsumowanie do `$GITHUB_STEP_SUMMARY`, więc jest ono na stronie przebiegu.
Przykład dla sytuacji „nie wysłano, bo już przypomniano w tym cyklu”:

```
## Powiadomienia — przebieg dzienny

**Nic do wysłania.**

| Osoba | Subskrypcje | W terminie | Wysłano | Zbyt wcześnie | Już przypomniane | Usunięte |
| --- | --- | --- | --- | --- | --- | --- |
| Ja | 1 | 0 | 0 | 0 | 1 | 0 |
```

Osobne wiersze dla „Zbyt wcześnie” i „Już przypomniane” biorą się z tego, że
to dwie różne przyczyny i trzeba je rozróżnić, żeby wiedzieć, czy coś jest
zepsute.

**2. Tryb testowy (`force`).** Nowe wejście w `workflow_dispatch`: wysyła
powiadomienie próbne („To jest próba powiadomienia…”) niezależnie od terminów
i **nie zapisuje `last_reminded_at`** — próba nie zużywa prawdziwego cyklu.
W nagłówku podsumowania jest to wprost napisane.

**3. Nieudana wysyłka nie zużywa już cyklu.** Wcześniej `last_reminded_at`
zapisywało się po próbie wysyłki **nawet gdy wszystko padło** — czyli
przypomnienie na cały cykl przepadało bez śladu. Teraz zapis jest tylko przy
`sent > 0`. Sprawdzone: przy nieosiągalnym endpoincie żaden zapis nie leci.

**4. Podpowiedzi przy awarii.** Gdy wysyłki padają, podsumowanie sugeruje
sprawdzenie pary kluczy VAPID (jej zmiana unieważnia wszystkie subskrypcje).
Gdy brak subskrypcji — gdzie je włączyć.

### Błąd znaleziony przy weryfikacji

Test integracyjny (mock Supabase + prawdziwe uruchomienie skryptu) wykrył, że
`src/lib/reminders.js` importował moduły **bez rozszerzeń `.js`**. Vite i
Vitest to tolerują, ale **Node uruchamiany wprost** (a tak działa workflow)
nie — `node scripts/send-reminders.mjs` wywalał się na
`ERR_MODULE_NOT_FOUND`. Bez tego testu wysypałoby się dopiero w CI, po
wypchnięciu. Rozszerzenia dodane w całym łańcuchu (`reminders.js` i
`lesionView.js`), z komentarzem, dlaczego muszą tam zostać.

### Czego nie zmieniono (decyzja właściciela)

**Raz dziennie wystarczy.** Bez drugiego crona, bez większej częstotliwości.
`last_reminded_at` (jedno przypomnienie na cykl) zostaje.

### Weryfikacja

15 nowych testów jednostkowych + przelot skryptu przez lokalny mock Supabase
w pięciu scenariuszach: po terminie, tryb próbny, termin jeszcze nie nadszedł,
już przypomniane, znamię usunięte. Każdy wypisał poprawne podsumowanie, a
żaden nie zapisał do bazy wtedy, kiedy nie powinien.
