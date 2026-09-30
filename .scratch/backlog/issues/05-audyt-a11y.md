# 05 — Audyt dostępności (a11y)

Type: task
Status: resolved
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

## Answer (2026-09-29)

### Część A — automat (zrobiona)

`@axe-core/playwright` (4.13) dołożony do istniejącego harnessu:
`e2e/a11y.spec.js`, 6 testów, tagi `wcag2a/wcag2aa/wcag21a/wcag21aa`.
Zakres: logowanie, wybór osoby, Kontrole (zwinięte i z filtrami), mapa ciała
z panelem pina, karta znamienia (Przegląd / Zdjęcia / Trend + otwarte menu
„⋯”) oraz **tryb ciemny**. Uruchamiane razem z `npm run e2e`, więc dostępność
pilnowana jest przy każdej zmianie, a nie raz na rok.

### Co znalazł (i co naprawione)

1. **Białe na `teal-600` w trybie ciemnym = 3,66:1** (wymagane 4,5:1).
   Nie jedna kontrolka — **cały wzorzec przycisku głównego**, 36 miejsc w
   9 plikach (`dark:bg-teal-600` + `dark:hover:bg-teal-500`). Teraz
   `dark:bg-teal-700`, a hover ciemniejszy (`teal-800`), nie jaśniejszy —
   jaśniejszy hover pogarszałby kontrast.
2. **Kontekst okolicy w nazwie znamienia** („Tył · …”) — `text-slate-400` na
   białym to 2,63:1. Teraz `text-slate-500` (4,76:1). Dotyczyło trzech
   ekranów (karta znamienia, panel pina, Kontrole).
3. **Plakietki podsumowania na Kontrolach** — `text-slate-500` na
   `bg-slate-100` dawało 4,34:1, czyli brakowało **0,16**. Teraz
   `text-slate-600`.

Fałszywy alarm (warto znać): axe zgłaszał kontrast **zakładek w trakcie
przejścia** — bada styl obliczony w danej chwili, więc łapał kolor w połowie
animacji. Na czas skanu wyłączamy animacje i przejścia.

### Weryfikacja

Nie tylko „testy przeszły”: sprawdziłem też, że naprawa jest realna —
`getComputedStyle` w trybie ciemnym zwraca teraz `bg-teal-700`, a nie
`teal-600`. Sprawdziłem również, że **zrzuty ekranu w trybie ciemnym
naprawdę porównują** (eksperyment: zmiana tła całej strony w dark zmieniła
wzorce) — wcześniej wyglądało to podejrzanie, ale przyczyną było to, że
zmieniałem elementy nieobecne w tym stanie ekranu.

### Część B — co zostaje

Czytnika ekranu (VoiceOver / TalkBack) automatem nie zastąpimy — to jedno
przejście na prawdziwym telefonie. Automat pokrywa etykiety, role, kontrast
i kolejność nagłówków; nie pokrywa tego, czy da się *zrozumieć* ekran ze
słuchu. Ścieżki klawiatury (`Escape` w menu, strzałki na zakładkach) są
natomiast testowalne i to jest następny krok.
