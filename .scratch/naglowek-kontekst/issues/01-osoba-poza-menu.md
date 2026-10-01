# 01 — Osoba poza hamburgerem: osobny przycisk „Ja ▾"

Type: task
Status: resolved
Map: .scratch/naglowek-kontekst/map.md

## Problem

Przycisk menu globalnego („≡") pokazywał nazwę osoby jako `visibleLabel`
(`Ja ≡`), więc **czytał się jak „Mój profil", a nie jak menu** — właściciel:
„zamiast hamburger menu to ja widzę że to Mój profil". Przycisk robił dwie
rzeczy naraz: „jesteś tu: Ja" + „otwórz menu". To pokłosie ustalenia 2 z
ticketu 14: osoba miała być widoczna, więc wylądowała jako etykieta hamburgera.

## Co dostarcza

Osoba to **kontekst**, więc dostaje osobny, widoczny przycisk obok menu; „≡"
zostaje czystym menu akcji.

## Kryteria akceptacji

- [x] Przycisk menu „≡" **nie** pokazuje nazwy osoby (`visibleLabel` usunięty).
- [x] Osoba ma osobny przycisk (`Ja ▾`), widoczny także na telefonie —
      chroni przed edycją nie tej osoby (ustalenie 2 z ticketu 14).
- [x] Przycisk osoby ma dostępną nazwę (`Osoba: <imię>. Zmień osobę`) i pełny
      cel dotykowy (min. 44 px).
- [x] „Zmień osobę" nie występuje już jako pozycja menu (byłby duplikatem).
- [x] Klik prowadzi na ekran wyboru osoby (jak dotychczas).

## Kontekst

- `src/components/Layout.jsx` — `menuItems` bez pozycji „Zmień osobę"; po prawej
  stronie nagłówka przycisk osoby renderowany, gdy `person && wOsobie`.
- `src/components/OverflowMenu.jsx` — `visibleLabel` zostaje jako ogólna opcja
  (już nieużywany w nagłówku); poprawiony komentarz.
- Zależne menu: pozycje to teraz motyw, instalacja (gdy dostępne), wyloguj.

## Comments

- Mobile bez osobnego wariantu układu: przycisk `Ja ▾` zmieścił się w tym samym
  jednowierszowym nagłówku (patrz pomiar w `## Answer`), więc nie ma dwóch
  różnych nagłówków na szerokości vs wysokości.

## Answer

Zrealizowane w `src/components/Layout.jsx`.

- „≡" ma teraz `label="Menu aplikacji"` i nie renderuje `visibleLabel`.
- Dodany osobny przycisk osoby:
  `aria-label={`Osoba: ${person.display_name}. Zmień osobę`}`, ikona `▾`,
  `onClick={() => navigate('/')}`, `min-h-[44px]`, `max-w-[7rem]` + `truncate`
  (długie nazwy nie rozjadą wiersza).
- Menu straciło pozycję „Zmień osobę (…)" — kontekst i akcję rozdzielono.

**Pomiar (375×667, ten sam co pilnuje `e2e/ui-budget.spec.js`):**
nagłówek **61 px** (bez zmian), chrom stały **147 px** (`61 + 54 + 32`).
Test „nagłówek wytrzymuje szeroką czcionkę (jak w CI na Linuksie)" przechodzi,
więc wiersz się nie zawija.

**Testy:** `e2e/person.spec.js` i `e2e/reminders.spec.js` klikają przycisk osoby
(`/Osoba: <imię>\. Zmień osobę/`) zamiast pozycji menu. `e2e/support/app.js`
(`openMenu`) — komentarz. Zestaw: **50 e2e + 101 jednostkowych** zielony.
Zrzuty ekranu przegenerowane (`npm run e2e:visual:update`, Windows).
