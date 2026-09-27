# 13 — Ujednolicenie nazw statusów między widokami

Type: task
Status: resolved
Blocked by: 03
Map: .scratch/mapa-widoki-znamiona/map.md

## Co dostarcza

Jedna nazwa statusu `urgent` w całej aplikacji, zgodnie z decyzją z ticketu 03.

## Kryteria akceptacji

- [ ] Legenda na mapie ciała (`BodyMap.jsx`) nie hardkoduje już
      „Do pilnej konsultacji" — bierze etykietę ze `statusMeta`/`STATUS_META`.
- [ ] Ta sama nazwa w: `StatusBadge`, panelu pinu, liście znamion, legendzie mapy.
- [ ] Pozostaje jedno źródło etykiet (`src/lib/status.js`).
- [ ] Nazwa zgodna z glosariuszem (`CONTEXT.md` → status `Wymaga uwagi`).

## Kontekst

- Rozjazd: `status.js` `urgent.label = 'Wymaga uwagi'` vs `BodyMap.jsx` legenda
  `urgent: 'Do pilnej konsultacji'`.
- Decyzja o wybranej nazwie → ticket 03.

## Comments

- Zablokowany przez 03 (wybór nazwy).

## Answer

Zrealizowane. Legenda `BodyMap.jsx` używa `STATUSES`/`statusMeta`; wszędzie „Wymaga uwagi" — jedno źródło w `status.js`.
