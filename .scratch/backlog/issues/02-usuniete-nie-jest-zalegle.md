# 02 — Znamiona „Usunięte” wciąż liczą się jako zaległe

Type: task
Status: resolved
Map: .scratch/backlog/map.md

## Problem

Status `removed` („Usunięte”) nie jest **nigdzie** pomijany przy liczeniu
terminów kontroli. Znalezione przy dodawaniu liczb na kartę osoby, ale dotyczy
całej aplikacji:

- `src/lib/useDueReminders.js` → znacznik przy „Kontrole” w nagłówku,
- `src/components/Reminders.jsx` → lista kontroli,
- `src/lib/reminderNotify.js` → codzienne powiadomienie in-app,
- `scripts/send-reminders.mjs` → Web Push w tle,
- `summarizePerson` (nowa karta osoby) → czerwona data + plakietka „zaległe”.

Skutek: po oznaczeniu znamienia jako „Usunięte” aplikacja **dalej o nie
nagabuje** — znacznik rośnie, przychodzą powiadomienia, a na karcie osoby
widnieje „zaległe”, którego nie da się wyczyścić inaczej niż usunięciem
znamienia.

Dodatkowo: „Usunięte” ma `STATUS_PRIORITY` 4, więc w Kontrolach ląduje na końcu
listy — czyli jest realnie widoczne, mimo że logicznie nie ma czego pilnować.

## Propozycja

Nowy, jawny szew w `src/lib/lesionView.js`:

```js
// Wiersze do liczenia TERMINÓW - bez znamion oznaczonych jako usunięte.
export function dueRows(lesions, options) {
  return buildRows(
    (lesions || []).filter((l) => l.status !== 'removed'),
    options
  )
}
```

- `buildRows` **zostaje bez zmian** — lista znamion nadal ma pokazywać
  „Usunięte” (jest filtr po statusie i użytkownik może chcieć do nich wrócić).
- `dueRows` używamy w: `useDueReminders`, `summarizePerson`, `Reminders.jsx`
  oraz w `scripts/send-reminders.mjs` (tam filtr po `status` w zapytaniu albo
  w pętli).
- Do rozważenia w trakcie: czy w Kontrolach ukryć „Usunięte” za przełącznikiem
  „pokaż usunięte” — to jednak zmiana UI, więc może zostać na osobny ticket.

## Kryteria akceptacji

- Po oznaczeniu znamienia jako „Usunięte”: znacznik przy „Kontrole” maleje,
  znika ono z Kontroli i z powiadomień, a karta osoby przestaje pokazywać
  „zaległe” (o ile nie ma innych zaległych).
- Lista znamion nadal pokazuje znamiona „Usunięte” (filtr po statusie działa).
- Testy: jednostkowe na `dueRows` (osobno „Usunięte” nie wpada, „Urgent” wpada)
  + e2e: oznaczenie znamienia jako „Usunięte” zdejmuje „zaległe” z karty osoby.

## Answer

Zrealizowane. Nowy, jawny szew w `src/lib/lesionView.js`:

```js
export function dueRows(lesions, options) {
  return buildRows((lesions || []).filter((l) => l.status !== 'removed'), options)
}
```

`buildRows` **został bez zmian** — lista znamion nadal pokazuje „Usunięte”
(filtr po statusie działa). `dueRows` weszło w cztery miejsca, które liczą
terminy:

- `src/lib/useDueReminders.js` — znacznik przy „Kontrole” w nagłówku
  (a tym samym powiadomienie in-app, bo `notifyOverdueOnce` dostaje już
  policzoną liczbę),
- `src/components/Reminders.jsx` — lista i licznik „Zaległe”,
- `src/lib/summary.js` — termin na karcie osoby,
- `scripts/send-reminders.mjs` — Web Push (filtr `status !== 'removed'`
  przed liczeniem terminów).

Świadoma asymetria na karcie osoby: `lesionCount` / `photoCount` liczą**całą**
dokumentację (także „Usunięte” — karta opisuje archiwum), a `next` / `overdue`
tylko znamiona pilnowane. Opisane w kodzie i w teście.

Testy: 4 nowe jednostkowe na `dueRows` + 1 na `summarizePerson` („Usunięte”
nie wyznaczają terminu) + nowy plik e2e `e2e/reminders.spec.js` (2 testy).
Sprawdzone mutacją: po wyłączeniu filtra padają 2 testy jednostkowe i 1 e2e,
czyli testy faktycznie pilnują tej reguły.

Nie zrobione (świadomie): ukrycie „Usuniętych” w Kontrolach za przełącznikiem
„pokaż usunięte” — to zmiana UI, nie była potrzebna do naprawy. Jeśli będzie
chciane, zasługuje na osobny ticket.
