 # 05 — Auto-kadrowanie z maski segmentatora (bounding box + padding)

Type: prototype
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Czy kadrowanie znamienia może korzystać z maski zwróconej przez
`InteractiveSegmenter` (bounding box + padding), zamiast ręcznego kadrowania?

Kontekst:

- `LesionSegmenter.jsx` liczy maskę (`mask.data`, `mask.width/height`) oraz obrys
  ręczny (`manualPoints`) — z obu da się policzyć bounding box.
- ADR-0001: geometria (rozmiar / kadr) jest dozwolona; to nie diagnoza.
- Pytania otwarte: kadr kwadratowy czy wg proporcji? ile paddingu wokół
  bounding boxa? co, gdy maska jest pusta (fallback na ręczny kadr)?
- Prototyp pokazuje efekt na prawdziwym zdjęciu znamienia.

Odpowiedź steruje ticketem 11 (centrowanie) i jest też wkładem do decyzji 07.

## Answer

Tak — auto-kadrowanie z maski jest możliwe i wdrożone. Bounding box liczony z
maski `InteractiveSegmenter` (a gdy brak maski — z obrysu ręcznego), następnie
przycięty do granic zdjęcia. Gdy maska/obrys są puste — fallback `null` (bez
kadrowania). Kadr stosowany przy zapisie zdjęcia; bez zmian schematu.

Prototyp (`.scratch/segmentator-edycja-centrowanie/prototype/cropBox.mjs`)
zakładał **kadr kwadratowy = bbox + padding 25%**. W implementacji ewoluowało to
w **kadr hybrydowy o stałym polu widzenia (mm)**: `suggestFovMm` liczy pole ≈
3× średnica znamienia (zaokrąglone do 5 mm, 15–120), a `mmCenteredCropBox`
wycina kwadrat wokół środka znamienia (`lesionCenterNorm`) o boku
`fovMm × pxPerMm` (niezależny od odległości zdjęcia, więc realna skala kadru
jest stała — widać wzrost). Ustalenie sterowało ticketem 11 (centrowanie) i
decyzją 07.

Implementacja: `src/lib/crop.js` (`bboxFromMask`, `bboxFromPoints`,
`lesionCenterNorm`, `suggestFovMm`, `mmCenteredCropBox`), konsument
`src/components/LesionSegmenter.jsx` + `PhotoUploadForm.jsx`.
Testy: `src/lib/crop.test.js` (14).
