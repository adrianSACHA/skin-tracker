# Wayfinder: Nagłówek — osoba to kontekst, tytuł bez powtórek

Effort: .scratch/naglowek-kontekst/
Tickets: .scratch/naglowek-kontekst/issues/

## Destination

Posprzątać nagłówek i tytuły stron tak, żeby **każdy fakt miał jedno miejsce**:
gdzie jesteś → zakładka, czyja to dokumentacja → przycisk osoby, co tu jest →
podtytuł. Bez powtarzania nazwy sekcji i bez osoby przyklejonej do hamburgera.

## Zgłoszenie właściciela (cytat)

> jak mam mapę i kontrole to jest jakiś header, czy to jest potrzebne? bo to
> powtarza się i tak samo zamiast hamburger menu to ja widzę że to Mój profil.
> Może ta informacja niech będzie w menu, na desktopie bym to dał normalnie,
> bo widzę że dalej jest w hamburger menu.
>
> mamy nagłówki na stronach i w sumie jestem w zakładce Mapa i w nagłówku jest
> napisane Mapa - Ja

Zmierzone, co dublowało się realnie:

| Gdzie | Mapa | Kontrole |
| --- | --- | --- |
| Zakładka (nagłówek) | `Mapa ciała` (na fonie `Mapa`) | `Kontrole` |
| Tytuł w treści (`h1`) | `Mapa ciała — Ja` | `Kontrole — Ja` |

Do tego nazwa osoby leciała dwa razy: jako `visibleLabel` na przycisku menu
(`Ja ≡` — czytane jak „Mój profil", nie jak menu) i jako „— Ja" w tytule.

## Decisions so far

- Nagłówek zostaje — to jedna wspólna nawigacja na obu ekranach, nie duplikat
  treści; po odchudzeniu (ticket 14) zajmuje 61 px (~9% ekranu telefonu).
- **Osoba = kontekst, menu = akcje.** Osoba wychodzi z przycisku „≡" i dostaje
  osobny, widoczny przycisk (`Ja ▾`) — to wraca ustalenie 2 z ticketu 14
  (ochrona przed edycją nie tej osoby), ale poza hamburgerem.
- **Tytuł strony nie powtarza zakładki.** `h1` zostaje dla czytników ekranu
  (`sr-only`), a sekcję nazywa aktywna zakładka.

## Not yet specified (mgła)

- Czy osoba ma docelowo otwierać rozwijaną listę osób (dropdown) zamiast
  przechodzić na ekran wyboru — na razie wystarcza przejście do wyboru osoby.
- Czy zrzuty wizualne dla Linuksa (CI) mają być przegenerowane tym samym
  commitem, czy osobnym przebiegiem workflow (istniejący proces).

## Out of scope

- Zmiany backendu (żadnych nie ma).
- Treść zastrzeżenia „nie diagnozuje" (ADR-0001) — zostaje.
- Zakładki sekcji na karcie znamienia (Przegląd / Zdjęcia / Trend) — bez zmian.

## Tickets

| #  | Type | Tytuł | Blocked by | Status |
| -- | ---- | ----- | ---------- | ------ |
| 01 | task | [Osoba poza hamburgerem: osobny przycisk „Ja ▾"](issues/01-osoba-poza-menu.md) | — | resolved |
| 02 | task | [Tytuł strony bez powtarzania zakładki](issues/02-tytul-bez-powtorek.md) | — | resolved |

## Frontier

Brak — oba tickety **resolved**. Zabezpieczone testami (`person`, `reminders`,
`ui-budget`) i przegenerowanymi zrzutami (`npm run e2e:visual:update`).
