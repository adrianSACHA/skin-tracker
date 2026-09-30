# 01 — Eksport / kopia zapasowa danych

Type: task
Status: wontfix
Map: .scratch/backlog/map.md

## Problem

Cały dorobek (zdjęcia w Supabase Storage + metadane w Postgres) żyje
**wyłącznie** w jednym darmowym projekcie Supabase. Jedyna rzecz, którą da się
dziś wyeksportować, to `.ics` z terminami kontroli (`src/lib/ics.js`).

Nie ma sposobu, żeby:
- zrobić kopię zdjęć i notatek „na wszelki wypadek”,
- przenieść dokumentację do innego projektu,
- mieć cokolwiek do pokazania lekarzowi w formie pliku.

Ryzyko: jedna awaria, jedna pomyłka przy usuwaniu osoby albo wygaśnięcie
darmowego projektu = utrata wieloletniej dokumentacji.

## Do decyzji (needs-triage)

- **Format:** ZIP (zdjęcia + `metadata.json` + `metadata.csv`)?
- **Zakres:** wszystko naraz czy per osoba?
- **Zdjęcia:** pobierać każde osobno przez `createSignedUrl` (prosto, ale dużo
  zapytań) czy złożyć ZIP w przeglądarce (pamięć! darmowy Storage to 1 GB).
- **Czy eksport ma mieć odpowiednik w imporcie** (odtworzenie na nowym
  projekcie) — czy na razie wystarczy „plik, który mam u siebie”.
- **Gdzie to ma żyć w UI:** ustawienia osoby, ekran główny, osobna trasa `#/export`?

## Propozycja (warianty)

- **A (najmniejsza):** eksport **jednej osoby** do ZIP — `metadata.json` +
  `metadata.csv` + folder `photos/`. Ogranicza pamięć i jest wygodne (jedna
  osoba na plik). W bibliotece do ZIP: `fflate` (mała, strumieniowa) zamiast
  `jszip`.
- **B (pełna):** eksport wszystkich osób + import odtwarzający dane. Większy
  zakres, ale to jedyna droga do realnej, odtwarzalnej kopii.
- **C (najtańsza):** tylko `metadata.json`/`csv`, bez zdjęć. Chroni notatki, ale
  **nie** chroni najcenniejszego, czyli zdjęć — nie polecam jako jedynej opcji.

Sugerowana kolejność: **A → (później) B**; C co najwyżej jako dodatek do A.

## Uwagi techniczne

- Zdjęcia są w prywatnym buckecie `lesion-photos`, ścieżki
  `{user_id}/{person_id}/...` — da się je pobrać przez `createSignedUrl`
  (`src/lib/uploadPhoto.js` już to obsługuje dla pojedynczego zdjęcia).
- Trzeba pamiętać o RLS: użytkownik widzi wyłącznie własne dane, więc eksport
  może działać w całości po stronie klienta, bez nowego backendu (spójne z
  ADR 0002 „brak backendu”).
- Przy ZIP w przeglądarce: pokazać postęp — przy kilkuset zdjęciach to trwa,
  a użytkownik nie może zostać bez informacji zwrotnej.

## Kryteria akceptacji

- Da się pobrać jeden plik z metadanymi i zdjęciami wybranej osoby.
- Struktura plików jest na tyle jasna, że da się ją odtworzyć ręcznie.
- Aplikacja nie diagnozuje i nie doradza — eksport to tylko kopia.

## Answer — `wontfix` (2026-09-30)

**Decyzja właściciela: nie robimy kopii.**

Sprawdzone przed decyzją (żeby nie odrzucać czegoś niewykonalnego):

- W bazie trzymamy **ścieżki** do zdjęć (`{konto}/{osoba}/{znamię}/{plik}`),
  nie adresy — adres podpisany powstaje dopiero przy wyświetlaniu. Wiersze są
  więc przenośne **dosłownie**: id, daty, rozmiary, notatki, ABCDE.
- Od konta zależą tylko **dwie** rzeczy: `owner_user_id` i pierwszy segment
  ścieżki pliku. Czyli przywrócenie u siebie nie wymaga żadnego przepisywania,
  a przeniesienie na inne konto — jednego.
- Czyli eksport/import **dałoby się zrobić** (~1 h + ~1 h). Odrzucone nie z
  powodu technicznego, a z powodu wartości: to ubezpieczenie, którego
  właściciel nie chce opłacać.

Świadomie przyjęte ryzyko: dokumentacja żyje **wyłącznie** w jednym darmowym
projekcie Supabase. Darmowy plan **nie robi kopii zapasowych** (to funkcja
płatna), więc nieudane „Usuń osobę" (kasuje też pliki) oraz utrata dostępu do
konta są nieodwracalne.

### Jeśli temat wróci — od czego zacząć

Nie od UI w aplikacji: przywracanie robi się raz na rok i z komputera, więc
właściwą formą jest **skrypt** (`npm run kopia` / `npm run przywroc`, klucz
`service_role`, wzorzec już jest w `scripts/send-reminders.mjs`). Skrypt
dodatkowo potrafi przywrócić do **innego projektu**, czego UI w przeglądarce
nie zrobi. Format pliku, który jest jednocześnie odtwarzalny:

```
skin-tracker-kopia-YYYY-MM-DD.zip
├── manifest.json   # wersja formatu, data, projekt, liczby wierszy
├── dane.json       # 4 tabele, wiersz w wiersz, z oryginalnymi id
└── pliki/          # dokładnie układ bucketu
```

Powiązane: tańsza alternatywa na **najczęstszą** pomyłkę (nieodwracalne
usunięcie osoby) to odwracalne kasowanie — patrz ticket 15.
