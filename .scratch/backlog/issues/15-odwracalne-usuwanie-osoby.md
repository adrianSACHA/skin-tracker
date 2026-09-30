# 15 — Odwracalne usunięcie osoby (archiwum zamiast kasowania)

Type: design
Status: needs-triage
Map: .scratch/backlog/map.md

## Problem

Właściciel zdecydował, że **nie robimy kopii zapasowej** (ticket 01 →
`wontfix`). Zostaje więc ryzyko, które tamta kopia miała pokryć: „Usuń osobę”
kasuje **nieodwracalnie** całą dokumentację — znamiona, zdjęcia, pomiary — i to
razem z plikami ze Storage.

Potwierdzenie w modalu chroni przed jednym: przed przypadkowym klikiem. Nie
chroni przed pomyłką w wyborze osoby ani przed „kliknąłem, bo myślałem, że to
coś innego”. A kopia pomaga tylko wtedy, gdy jakaś istnieje i jest świeża.

To rozwiązanie działa **w momencie pomyłki**, a nie „jeśli akurat zrobiłem kopię”.

## Propozycja

Zamiast kasować — **archiwizować**:

- kolumna `archived_at` w `monitored_persons` (albo `is_archived`),
- zarchiwizowana osoba znika z ekranu wyboru albo jest tam wyszarzona,
  z akcją „Przywróć”,
- jej znamiona, zdjęcia i pliki **zostają nietknięte**,
- trwałe usunięcie zostaje jako **osobna, druga decyzja** („Usuń trwale”),
  świadomie i po potwierdzeniu.

To samo warto rozważyć dla **widoku ciała**: jego usunięcie też zabiera znamiona
i pliki, i też jest nieodwracalne.

## Do ustalenia

1. Czy zarchiwizowana osoba ma znikać z listy, czy być widoczna jako wyszarzona?
2. Czy archiwizacja obejmuje też widoki ciała (i pojedyncze znamiona)?
3. Czy „usuń trwale” w ogóle zostaje? Jeśli tak — gdzie, żeby nie kusiło.

## Kryteria akceptacji

- Usunięcie osoby da się cofnąć **bez utraty zdjęć**.
- Test w `e2e/` pilnuje, że po przywróceniu wracają wszystkie znamiona i zdjęcia
  (nie tylko rekord osoby).
