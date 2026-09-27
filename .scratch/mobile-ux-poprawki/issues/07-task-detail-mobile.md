# 07 — Szczegóły znamienia: porównanie / wykres / historia na mobile

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Dopracowanie `LesionDetail` pod wąskie ekrany: porównanie zdjęć wygodnym
suwakiem, czytelniejszy wykres i powiększanie zdjęć z historii.

## Kryteria akceptacji

- [x] Porównanie: przeciągany uchwyt (`⇄`) ustawia podział zdjęć (A pod spodem,
      B odsłaniane `clip-path`); działa palcem/myszką; do tego suwak w formularzu
      (dostępność).
- [x] Wykres: gęste daty się nie nakładają (`minTickGap`, `preserveStartEnd`),
      węższa oś Y — czytelniej na telefonie.
- [x] Historia: klik w miniaturę otwiera powiększenie (lightbox) na cały ekran;
      miniatury responsywne (`h-20 w-20 sm:h-24 sm:w-24`).

## Answer

Zrealizowane w `src/components/LesionDetail.jsx`: `compareRef`/`compareDragRef`
+ handlery `onCompare*`, uchwyt porównania, `clipPath` na zdjęciu B; `XAxis`
(`minTickGap`) i `YAxis` (`width`); lightbox (`enlarge`) na miniaturze historii.
