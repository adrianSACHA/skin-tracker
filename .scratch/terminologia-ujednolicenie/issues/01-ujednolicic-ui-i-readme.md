# 01 — Ujednolicić UI i README z glosariuszem

Type: task
Status: ready-for-agent

## Kontekst

Glosariusz (`CONTEXT.md`) ustalił kanoniczne pojęcia, ale UI i README używają
innych słów. Rozjazdy zebrane podczas sesji `/grill-with-docs` (ADR-0001..3).

## Do zrobienia

- [x] UI: „profil" → `Osoba` — m.in. `PersonSelector`, `PersonContext`, komunikaty i przyciski.
- [x] UI/logowanie: rozdzielić `Konto` (logowanie) od `Osoby` (wybór) tam, gdzie są mylone.
- [x] README: „sesja" / „sesje" → `Zdjęcie`.
- [x] README: „znamion / zmian skórnych" w tytule i opisie → `Znamię` (albo świadomie zostawić jako opis potoczny — do decyzji).
- [x] Sprawdzić ewentualne odwołania w testach / zrzutach ekranu (`ux-report/`).

## Kryteria akceptacji

- [x] Słowa z `_Avoid_` w `CONTEXT.md` nie występują w UI ani README.
- [x] Żadne zmiany nie ruszają nazw w bazie ani kodu (`monitored_persons`, `lesions`, `lesion_photos`, …).

## Uwagi

- Kod i baza zostają po angielsku — to świadomie **poza** zakresem tego zadania.
- Uwaga na parę `Konto` vs `Osoba`: logowanie dotyczy konta, wybór na ekranie dotyczy osoby.

## Comments

- Utworzone na koniec sesji `/grill-with-docs` jako follow-up do glosariusza.
- Zrealizowane. 46 zamian w 16 plikach (UI: „profil"→„osoba", „sesja"→„zdjęcie", auth-sesja→„zalogowanie"; README: „profil"/„sesja"/„zmian skórnych"/„użytkownik"→„konto"). Zmienione też komentarze w kodzie (m.in. `PersonContext`, `PersonSelector`). Nazwy w bazie/kodzie (`monitored_persons`, `PersonContext`, …) nietknięte.
- Zrzuty w `ux-report/` są nieaktualne (stare etykiety) — katalog jest w `.gitignore`, więc nie ruszany; do odświeżenia przy najbliższym teście UX.
- Uwaga narzędziowa: Edit tools w tym środowisku gubiły ścieżki i uszkodziły plik — sweep wykonany skryptem Node z asercjami (literalne zamiany, bez zmian końców linii).
