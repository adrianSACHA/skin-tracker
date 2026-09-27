# 06 — Panel ustawień widoku: osobny ekran / modal / bottom sheet

Type: prototype
Status: resolved
Blocked by: brak
Map: .scratch/mapa-widoki-znamiona/map.md

## Pytanie

Jaką formę ma mieć panel ustawień widoku (zmiana nazwy + `Usuń widok`)?

Warianty z mgły: **osobny ekran** / **modal** / **bottom sheet**.

Kontekst:

- Feedback użytkownika: „ad4. Może być w panelu." → w panelu (nie w szybkim menu).
- Panel ma zawierać: zmianę nazwy widoku (dropdown słownika + własna nazwa,
  ticket 09) oraz `Usuń widok` (ticket 12).
- Platforma główna: Chrome/Android → bottom sheet jest naturalny na mobile,
  ale modal/ekran musi działać też na desktopie (`lg:` układ dwukolumnowy mapy).
- Wejście do panelu: z `⋯` w nagłówku (ticket 05) czy osobny przycisk?
  Do ustalenia razem z 04/05.

Odpowiedź steruje ticketem 12.

## Answer

Forma: **modal** — spójny z `ConfirmDialog`, działa i na desktopie (układ
dwukolumnowy mapy), i na Androidzie; bez nowego routingu (feedback: „może
być w panelu").

Zawartość: zmiana nazwy okolicy (dropdown słownika + własna nazwa) oraz
sekcja `Usuń widok` (danger) z modalem potwierdzenia. Wejście z menu `⋯`
→ „Ustawienia widoku…"; Esc i klik w tło zamykają.
