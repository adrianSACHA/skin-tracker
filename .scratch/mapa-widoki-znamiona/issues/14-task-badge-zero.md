# 14 — Wyszarzenie badge'y liczbowych przy wartości 0

Type: task
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Badge'e `Zaległe: 0` i `W ciągu 30 dni: 0` w widoku `Kontrole` są wyszarzone,
gdy liczą zero — kolor ma być sygnałem, a zero = brak sygnału.

## Kryteria akceptacji

- [ ] Gdy `overdue === 0`, badge „Zaległe" przyjmuje neutralne (szare) barwy
      zamiast czerwieni.
- [ ] Gdy `soon === 0`, badge „W ciągu 30 dni" przyjmuje neutralne barwy.
- [ ] Przy wartości > 0 badge wraca do koloru sygnałowego (czerwony / teal).
- [ ] Kropka w badge'u również neutralna przy zerze.
- [ ] Kontrast tekstu/tła spełnia WCAG AA w obu stanach.

## Kontekst

- `src/components/Reminders.jsx` → pasek podsumowania hardkoduje
  `bg-red-100 … / bg-teal-100 …` niezależnie od wartości.

## Comments

- W pełni rozstrzygnięte w „Decisions so far" — brak zależności.

## Answer

Zrealizowane. `Reminders.jsx` wyszarza badge przy 0 (neutralne tło i kropka).
