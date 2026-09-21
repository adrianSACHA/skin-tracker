# 01 — Ujednolicić UI i README z glosariuszem

Type: task
Status: ready-for-agent

## Kontekst

Glosariusz (`CONTEXT.md`) ustalił kanoniczne pojęcia, ale UI i README używają
innych słów. Rozjazdy zebrane podczas sesji `/grill-with-docs` (ADR-0001..3).

## Do zrobienia

- [ ] UI: „profil" → `Osoba` — m.in. `PersonSelector`, `PersonContext`, komunikaty i przyciski.
- [ ] UI/logowanie: rozdzielić `Konto` (logowanie) od `Osoby` (wybór) tam, gdzie są mylone.
- [ ] README: „sesja" / „sesje" → `Zdjęcie`.
- [ ] README: „znamion / zmian skórnych" w tytule i opisie → `Znamię` (albo świadomie zostawić jako opis potoczny — do decyzji).
- [ ] Sprawdzić ewentualne odwołania w testach / zrzutach ekranu (`ux-report/`).

## Kryteria akceptacji

- [ ] Słowa z `_Avoid_` w `CONTEXT.md` nie występują w UI ani README.
- [ ] Żadne zmiany nie ruszają nazw w bazie ani kodu (`monitored_persons`, `lesions`, `lesion_photos`, …).

## Uwagi

- Kod i baza zostają po angielsku — to świadomie **poza** zakresem tego zadania.
- Uwaga na parę `Konto` vs `Osoba`: logowanie dotyczy konta, wybór na ekranie dotyczy osoby.

## Comments

- Utworzone na koniec sesji `/grill-with-docs` jako follow-up do glosariusza.
