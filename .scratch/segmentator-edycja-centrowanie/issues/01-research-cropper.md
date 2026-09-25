# 01 — Cropper: `react-easy-crop` czy własny crop na `<canvas>`

Type: research
Status: resolved
Map: .scratch/segmentator-edycja-centrowanie/map.md

## Pytanie

Czy edycja zdjęcia (kadrowanie) ma korzystać z gotowej zależności
(`react-easy-crop`) czy z własnej implementacji na `<canvas>`?

Kryteria oceny:

- rozmiar / waga bundle (aplikacja to PWA na Chrome/Android),
- wsparcie TypeScript i koszt utrzymania,
- dostępność (klawiatura, ARIA, obsługa dotyku),
- zgodność z już używanymi zależnościami: `react-zoom-pan-pinch` (4.2.0)
  i `browser-image-compression` (0.2.2).

Rozstrzygnięcie dotyczy zakresu „crop" w tickecie 08 (edycja zdjęcia).

## Answer

**Zbadane fakty** (`react-easy-crop@6.2.3`, sprawdzone na registry + bundlephobia):

- ~25,4 kB minified / **~7,3 kB gzip**; **1 zależność** (`normalize-wheel`, ~3 kB).
- peer deps **React ≥16.4** (React 18 OK); **dostarcza typy TS**; `sideEffects:false`
  (tree-shakeable); MIT; aktywnie utrzymywany.
- Wymaga importu CSS (`react-easy-crop.css`).
- **Dostępność:** obsługuje nawigację klawiaturą — prop `keyboardStep` (krok w px
  na strzałkę); API: `cropShape: 'rect' | 'round'`, `aspect`, `rotation`, `zoom`,
  `objectFit`, `onCropComplete(croppedArea, croppedAreaPixels)`.
- Biblioteka dokumentuje wzorzec `getCroppedImg` (canvas: rotate + flip + crop →
  blob) — czyli **finalną transformację i tak robimy na `<canvas>`**.
- Alternatywa: `react-image-crop` — **0 zależności**, jawnie reklamuje „keyboard
  accessibility"; gdybyśmy chcieli zależność bez własnego `normalize-wheel`.

**Decyzja:**

1. **Obrót / flip / reset** → **własny, mały helper na `<canvas>`** (bez zależności).
   To trywialne i nie uzasadnia nowej zależności.
2. **Interaktywne, ręczne kadrowanie** → **`react-easy-crop`** (7,3 kB gzip, typy,
   a11y przez `keyboardStep`). Odtworzenie od zera przeciągalnego / skalowalnego /
   klawiaturowego kadru to fałszywa oszczędność.
3. **Warunek:** dodajemy ją tylko **jeśli ręczne kadrowanie zostaje w zakresie**
   po rozstrzygnięciu `05`/`11`. Jeśli centrowanie zrobimy **automatycznie** z maski
   segmentatora (`05`), interaktywny cropper jest zbędny → **żadnej nowej
   zależności** (canvas: rotate/flip/reset + auto-kadr).

**Odrzucone:** cięższe kombajny do edycji; ręczne od zera UI kadrowania z gestami
i dostępnością.

**Wniosek dla `08`:** zakres „ew. crop" rozstrzyga się razem z `05`/`11`. Obrót/
flip/reset robimy niezależnie od tej decyzji — bez nowej zależności.
