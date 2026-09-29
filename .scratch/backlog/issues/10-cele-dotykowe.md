# 10 — Za małe cele dotykowe (piny, suwak, linki tekstowe)

Type: task
Status: needs-triage
Map: .scratch/backlog/map.md

## Problem

Przegląd wszystkich ekranów na 375×667 (iPhone SE) wykazał, że projekt trzyma
swoją zasadę „min. 44 px” w przyciskach akcji, ale **siedem miejsc jej nie
łapie**. Piny na mapie są tu najgorsze, bo to główna interakcja tego ekranu.

| # | Element | Rozmiar | Gdzie |
| --- | --- | --- | --- |
| 1 | **Piny znamion** | **20×20** | mapa ciała (`BodyMap.jsx`) |
| 2 | **Suwak porównania zdjęć** | **8 px wysokości** | szczegóły znamienia (`LesionDetail.jsx`) |
| 3 | „Usuń zdjęcie” | 24 px | szczegóły znamienia |
| 4 | Breadcrumby: „< Mapa ciała”, „< Wróć do…” | 19–21 px | mapa, lista, szczegóły |
| 5 | Nazwy znamion (link do szczegółów) | 21 px | Kontrole |
| 6 | Logo / nazwa aplikacji (link do `/`) | 24 px | nagłówek, każdy ekran |
| 7 | „Zamknij” w panelu pina | 28 px | mapa |

*(Checkboxy statusu wyszły 16 px, ale to fałszywy alarm — klikalna jest cała
etykieta z `min-h-[44px]`.)*

Dla porządku: poza tym przegląd wypadł dobrze — **zero poziomego przewijania**
na wszystkich ekranach, menu `⋯` i modal potwierdzenia mieszczą się w kadrze,
a nagłówek ma 121 px.

## Propozycja (kolejność = priorytet)

1. **Piny (P0)** — powiększyć obszar trafienia do ~44 px, zachowując wygląd
   małej kropki (większy, niewidoczny przycisk; kropka wyśrodkowana). Uwaga:
   piny są pozycjonowane procentowo, więc trzeba je zakotwiczyć tak, żeby
   **środek obszaru trafienia pokrywał się ze środkiem kropki** — inaczej
   przesunie się wizualnie.
2. **Suwak porównania (P1)** — pogrubić obszar chwytu (pasek może zostać cienki,
   ale „uchwyt” musi być duży).
3. **„Usuń zdjęcie” (P1)** — akcja destrukcyjna z 24 px celem; ratuje ją tylko
   modal potwierdzenia.
4. **Linki tekstowe (P2)** — dodać pionowy padding, żeby miały 44 px wysokości
   **bez zmiany wyglądu** (breadcrumby, nazwy na Kontrolach, logo).
5. **„Zamknij” w panelu pina (P2)**.

## Zabezpieczenie

Rozszerzyć `e2e/ui-budget.spec.js` o regułę: **każdy element interaktywny na
kluczowych ekranach ma ≥44 px wysokości**, z jawną, skomentowaną listą wyjątków
(dokładnie jak w tabeli wyżej). Bez tego te same przypadki wrócą przy kolejnym
ekranie.

Uwaga na kolejność: piny zmieniają interakcję mapy, więc warto je zrobić razem
z decyzją o nawigacji (ticket 09), jeśli miałaby dotykać tego samego ekranu.
