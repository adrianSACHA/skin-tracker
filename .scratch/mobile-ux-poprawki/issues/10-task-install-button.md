# 10 — Przycisk „Zainstaluj" (PWA)

Type: task
Status: resolved
Map: .scratch/mobile-ux-poprawki/map.md

## Co dostarcza

Możliwość dodania aplikacji do ekranu początkowego **w każdej chwili** —
natywny prompt Chrome pokazuje się raz i po odrzuceniu trudno go wywołać.

## Kryteria akceptacji

- [x] Przechwycony `beforeinstallprompt` → własny przycisk „Zainstaluj" w
      nagłówku (`Layout`); klik wywołuje `prompt()`.
- [x] Przycisk znika, gdy aplikacja jest już zainstalowana (standalone) lub po
      `appinstalled`.
- [x] Service worker ma handler `fetch` (wymóg instalowalności PWA w Chrome).

## Answer

`src/lib/install.js` (`useInstallPrompt`, `isStandalone`) + przycisk w
`src/components/Layout.jsx`; `public/sw.js` dostał no-op `fetch`.
