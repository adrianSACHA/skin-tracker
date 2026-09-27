# 03 — Ujednolicenie nazwy statusu: `Do pilnej konsultacji` vs `Wymaga uwagi`

Type: grilling
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Którą nazwę statusu `urgent` przyjąć w całej aplikacji: „Do pilnej konsultacji"
(c mapa ciała) czy „Wymaga uwagi" (lista, słownik `status.js`)?

Kontekst:

- `src/lib/status.js` → `STATUS_META.urgent.label = 'Wymaga uwagi'`
  (używane przez `StatusBadge`, `LesionInfoPanel`, listę znamion).
- `src/components/BodyMap.jsx` → legenda na dole hardkoduje
  `urgent: 'Do pilnej konsultacji'` → rozjazd wizualny na tej samej etykiecie.
- Z „Decisions so far": sugerowane **„Wymaga uwagi"** (krótsze, mniej
  alarmistyczne, zgodne z `CONTEXT.md`, gdzie status `Wymaga uwagi` jest
  kanoniczną etykietą).
- Uwaga: „Wymaga uwagi" nie może być mylone z „Do obserwacji" (`watch`) —
  potwierdzić, że obie etykiety są czytelnie różne.

Odpowiedź steruje ticketem 13 (implementacja).

## Answer

Przyjęta nazwa: **„Wymaga uwagi"** (zgodna z `CONTEXT.md` i
`src/lib/status.js`, gdzie `urgent.label` już tak brzmi).

Poprawka dotyczy wyłącznie legendy `BodyMap.jsx`, która hardkodowała
„Do pilnej konsultacji" — teraz bierze etykietę ze `statusMeta`/`STATUSES`.
