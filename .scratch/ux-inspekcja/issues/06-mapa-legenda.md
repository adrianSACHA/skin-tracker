# 06 — Mapa ciała: legenda statusów zajmuje miejsce

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Legenda 5 statusów jest zawsze widoczna pod mapą. Na telefonie zabiera miejsce,
a statusy są też widoczne przy pinach i w panelu pina.

## Decyzja (od użytkownika)

Legenda jest **potrzebna** — bez niej nie wiadomo, co oznacza dany kolor.

## Propozycja

- Zamiast stale widocznej legendy: **przycisk „Kolory statusów"** (z ikoną „?")
  obok mapy, który **rozwija** legendę w miejscu (popover / pasek). Domyślnie
  zwinięty na telefonie; na większych ekranach może być widoczny od razu.
- Kolorowe kropki przy pinach i etykieta statusu w panelu pina zostają (kontekst
  na bieżąco).

## Kryteria akceptacji

- [x] Legenda dostępna jednym kliknięciem (nie znika na stałe).
- [x] Domyślnie nie zajmuje miejsca na telefonie.
- [x] Na desktopie może być widoczna od razu.

## Answer

Zrealizowane w src/components/BodyMap.jsx: legenda pod przyciskiem „Kolory
statusów" (rozwija/zwija). Domyślnie rozwinięta od szerokości lg (desktop),
zwinięta na telefonie. Kropki przy pinach i etykieta w panelu zostają.
