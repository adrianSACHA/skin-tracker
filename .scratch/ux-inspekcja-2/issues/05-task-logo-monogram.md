# 05 — Logo: monogram „ST" (loader, nagłówek, favicon)

Type: task
Status: resolved
Map: .scratch/ux-inspekcja-2/map.md

## Co dostarcza

Ekran ładowania (po sprawdzeniu dostępu) miał ciężki, wirujący pierścień wokół
gradientowej kropki — wyglądał dziwnie. Zastępujemy go spójnym znakiem:
**monogram „ST"**.

## Kryteria akceptacji

- [x] Komponent `Logo` (monogram „ST" w zaokrąglonym kwadracie).
- [x] Loader w `AuthGate` używa logo z delikatnym pulsem (`motion-safe`).
- [x] Ten sam znak w nagłówku (`Layout`) obok nazwy.
- [x] Favicon (SVG) + wpis w manifeście PWA.
- [x] Kolory `gray-*` → `slate-*` w loaderach.

## Answer

`src/components/Logo.jsx` (monogram), `public/favicon.svg`, `index.html`
(favicon), `AuthGate.jsx` (loader), `Layout.jsx` (nagłówek),
`LoadingFallback.jsx` (kolory), `manifest.webmanifest` (ikona SVG).
