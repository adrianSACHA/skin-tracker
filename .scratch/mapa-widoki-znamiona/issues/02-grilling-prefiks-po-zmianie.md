# 02 — Prefiks znamienia po zmianie nazwy widoku

Type: grilling
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Czy prefiks nazwy znamienia jest niezmienny po zmianie nazwy widoku, czy się
aktualizuje?

Przykład z mgły: widok „Tył" → „Plecy". Czy znamię `Tył-1` zmienia się na
`Plecy-1`?

Kontekst:

- Nazwa znamienia jest auto-generowana z prefiksu okolicy + numer
  (`Tył-1`, `Plecy-prawa-1`) i może być nadpisana ręcznie.
- `lesions.label` to płaski string w bazie — nie ma osobnego pola `prefix`.
  Aktualizacja prefiksu = nadpisanie `label` wszystkich znamion widoku.
- Trzeba rozstrzygnąć też: co z znamionami o ręcznie nadpisanej nazwie
  (`Tył-3 → „znamię przy łopatce"`) — czy prefiks je pomija?

Odpowiedź steruje ticketem 08 (auto-nazwy znamion) i 12 (zmiana nazwy widoku).

## Answer

Prefiks jest **niezmienny**: zmiana nazwy widoku (np. „Tył" → „Plecy")
**nie** przepisuje istniejących `lesions.label` — `Tył-1` zostaje.
Nowe znamiona w tym widoku dostaną prefiks nowej okolicy.
Znamiona z ręcznie nadpisaną nazwą nie są ruszane.

Uzasadnienie: stabilna historia nazw, brak migracji danych. Implementacja
`saveViewRename` świadomie pomija rewrite etykiet.
