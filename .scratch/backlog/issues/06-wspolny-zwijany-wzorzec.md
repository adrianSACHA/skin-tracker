# 06 — Wspólny wzorzec zwijanych paneli

Type: task
Status: wontfix
Map: .scratch/backlog/map.md

## Problem

Trzy niezależne implementacje tego samego pomysłu (panel zwijany
przyciskiem z `aria-expanded`):

- filtry na liście znamion (`LesionsList.jsx`),
- panel „Przypomnienia na telefon” w Kontrolach (`Reminders.jsx`),
- legenda statusów na mapie ciała (`BodyMap.jsx`).

## Dlaczego `wontfix`

- **Brak zysku dla użytkownika.** Nic się nie zmieni w tym, co widać i co się
  klika. To porządkowanie kodu dla samego porządkowania.
- **Ryzyko większe niż korzyść.** Wszystkie trzy działają i mają przemyślane
  szczegóły (stan w adresie w liście, zwijanie do jednej linii w Kontrolach,
  domyślnie rozwinięta legenda). Wspólny komponent musiałby pogodzić te różnice,
  a każda regresja tu jest widoczna dla użytkownika.
- **Zasada YAGNI.** Trzy przypadki to jeszcze nie wzorzec. Wspólna abstrakcja
  zwykle wychodzi lepiej, gdy widzi się **cztery**–pięć użyć i wiadomo, co jest
  w nich naprawdę wspólne.

## Kiedy wrócić

- Gdy pojawi się czwarte miejsce z tym samym wzorcem, **albo**
- gdy trzeba będzie zmienić wszystkie trzy naraz (np. wspólne animowanie
  rozwijania) — wtedy duplikacja faktycznie zaczyna boleć.

Do tego czasu: zostawić jak jest. Jeśli kiedyś wrócimy, punktem wyjścia jest
`OverflowMenu.jsx` — to już przykład wyciągnięcia wspólnego komponentu, który
się udał, bo był potrzebny w kilku miejscach naraz i miał jasny kontrakt.
