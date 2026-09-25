 # 05 — Auto-kadrowanie z maski segmentatora (bounding box + padding)

Type: prototype
Status: claimed
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

_(uzupełniane przy rozwiązywaniu)_
