# 02 — Lista: gęstość karty znamienia

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Karta znamienia to 4 linie: nazwa (+ okolica), badge statusu, "Ostatnie zdjęcie",
"Sugerowana następna kontrola: …" oraz link "Zobacz kontrolę →". Link dubluje
zakładkę Kontrole i dodaje szumu.

## Propozycja

- Skondensować do ~2 linii: (1) nazwa + kropka/badge statusu; (2) termin kontroli
  (z etykietą "zaległe" gdy po terminie).
- "Zobacz kontrolę →" zastąpić mniejszą ikoną lub usunąć (jest zakładka Kontrole).
- Całe kafelkowe kliknięcie prowadzi do szczegółów znamienia.

## Kryteria akceptacji

- [x] Karta mieści się w ~2 liniach na telefonie.
- [x] Status i termin są czytelne; "zaległe" widoczne.
- [x] Klik w kartę otwiera szczegóły znamienia.

## Answer

Zrealizowane w LesionsList.jsx: karta to cały Link — linia 1: nazwa (z okolicą)
+ badge statusu; linia 2: "Kontrola: <data>" + "zaległe". Usunięto "Ostatnie
zdjęcie" i link "Zobacz kontrolę" (dublował zakładkę Kontrole).
