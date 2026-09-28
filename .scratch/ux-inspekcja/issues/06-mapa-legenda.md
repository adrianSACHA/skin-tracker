# 06 — Mapa ciała: legenda statusów zajmuje miejsce

Type: task
Status: ready-for-agent
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

- [ ] Legenda dostępna jednym kliknięciem (nie znika na stałe).
- [ ] Domyślnie nie zajmuje miejsca na telefonie.
- [ ] Na desktopie może być widoczna od razu.
