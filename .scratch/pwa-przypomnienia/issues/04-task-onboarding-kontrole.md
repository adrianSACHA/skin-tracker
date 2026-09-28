# 04 — Onboarding przypomnień w Kontrolach

Type: task
Status: resolved
Map: .scratch/pwa-przypomnienia/map.md

## Co dostarcza

W widoku Kontrole ma być jasne, że aby dostawać powiadomienia w tle, trzeba:
zainstalować aplikację, dać zgodę i włączyć „Powiadomienia w tle" — inaczej
zadziałają tylko przypomnienia w kalendarzu.

## Kryteria akceptacji

- [x] Panel na górze Kontroli z wyjaśnieniem i **listą statusów**:
      aplikacja zainstalowana / zgoda na powiadomienia / powiadomienia w tle.
- [x] Akcje w miejscu braków: „Zainstaluj" (gdy można), „Włącz"/„Wyłącz".
- [x] Gdy wszystko spełnione → informacja „Wszystko gotowe".
- [x] Dolny checkbox „Powiadomienia w tle" usunięty (przeniesiony do panelu).

## Answer

`src/components/Reminders.jsx`: panel onboardingowy + `applyPush(on)` zamiast
checkboxowego `togglePush`; użyto `isStandalone` i `useInstallPrompt`.
