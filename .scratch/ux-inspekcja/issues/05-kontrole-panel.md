# 05 — Kontrole: panel "Przypomnienia na telefon" zwijany

Type: task
Status: resolved
Map: .scratch/ux-inspekcja/map.md

## Problem

Panel onboardingowy na górze Kontroli zajmuje miejsce także wtedy, gdy
wszystko jest już włączone (instalacja + zgoda + push).

## Propozycja

- Gdy wszystkie 3 warunki spełnione → zwinąć do jednej linii:
  **"Powiadomienia w tle: włączone ✓"** z możliwością rozwinięcia.
- Gdy czegoś brakuje → pokazać pełny panel z listą statusów i akcjami.

## Kryteria akceptacji

- [x] Stan "wszystko gotowe" to jedna zwijalna linia.
- [x] Brakujący warunek rozwija pełną listę z akcją.

## Answer

Zrealizowane w src/components/Reminders.jsx: gdy instalacja + zgoda + push są
spełnione, panel zwija się do jednej linii „Powiadomienia w tle: włączone"
z przyciskiem „Szczegóły"; przy brakach pokazuje pełną listę z akcjami.
