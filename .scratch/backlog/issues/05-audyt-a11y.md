# 05 — Audyt dostępności (a11y)

Type: task
Status: needs-triage
Map: .scratch/backlog/map.md

## Problem

W kodzie sporo już jest — `aria-label`, `aria-pressed`, `aria-expanded`,
`role="alert"`, `focus-visible:ring-*`, minimalne cele dotykowe `min-h-[44px]`,
`prefers-reduced-motion` — ale **nigdy nie było systematycznego przejścia**.
Wiemy, że pojedyncze elementy są poprawne; nie wiemy, czy w całości da się
aplikacją posługiwać klawiaturą i czytnikiem ekranu.

Praktyczny scenariusz: to aplikacja do oglądania zdjęć z bliska, używana też
przez osobę starszą. Kontrast i rozmiar celów dotykowych mają tu realne
znaczenie, nie tylko „checkbox w audycie”.

## Do decyzji (needs-triage)

- Zakres: poziom WCAG AA na kluczowych ekranach, czy pełny AA na wszystkim?
- Narzędzie: automat (axe-core) czy przegląd ręczny, czy jedno i drugie?
- Czy audyt ma objąć też **tryb ciemny** (drugi zestaw kontrastów)?

## Propozycja

- **A (pierwsze, tanie):** `@axe-core/playwright` dołożone do istniejącego
  harnessu e2e, na 4–5 ekranach (logowanie, wybór osoby, lista, mapa, panel
  pina). Automat wyłapie brakujące etykiety, błędne role, kontrast, kolejność
  nagłówków. Uruchamiane razem z `npm run e2e`.
- **B (później):** przejście ręczne klawiaturą (Tab/Escape w menu `⋯` i modalach)
  oraz czytnikiem ekranu (VoiceOver/TalkBack). Tego automat nie sprawdzi.

Sugerowana kolejność: **A**, potem **B** na tych ekranach, które A wskaże jako
problematyczne. Wyniki trafiają jako osobne tickety — audyt bez wniosków nie
zmienia niczego.

## Kryteria akceptacji

- Jest lista konkretnych problemów z lokalizacją (plik + element), nie ogólne
  „poprawić dostępność”.
- Przynajmniej najpoważniejsze są naprawione albo mają własne tickety.
