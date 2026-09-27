# 08 — „Do kalendarza": menu w kadrze na mobile

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Menu „Do kalendarza" (`.ics` / Google / Outlook) nie może wychodzić poza ekran,
gdy przycisk nie stoi przy lewej krawędzi (np. po zawinięciu przycisków).

## Kryteria akceptacji

- [x] Menu pozycjonowane w JS i przypięte do viewportu (`fixed`), dociągane do
      krawędzi (min. 8 px), zwężane na bardzo wąskim ekranie.
- [x] Zamykanie: klik poza, Escape, po wyborze pozycji.
- [x] Działa w „Kontrole" i w szczegółach znamienia (wspólny komponent).

## Answer

`src/components/CalendarReminderButton.jsx` przepisany z `<details>` + `absolute`
na przycisk + stan + `fixed` z pozycją liczoną w JS (wzorzec z menu `⋯`).
