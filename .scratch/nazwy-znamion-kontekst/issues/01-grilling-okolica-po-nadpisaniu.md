# 01 — Okolica po nadpisaniu nazwy znamienia

Type: grilling
Status: resolved
Map: .scratch/nazwy-znamion-kontekst/map.md

## Pytanie

Gdy znamie ma nadpisaną ręcznie nazwę (np. `Tył-3` → „znamię przy łopatce"),
czy **pokazywać jeszcze okolicę ciała** jako kontekst (żeby wiedzieć, gdzie ono
jest)?

Dziś: nadpisana nazwa jest używana wprost — po nadpisaniu okolica znika z
nazwy.

## Opcje

- **A. Nie** — pokazuj tylko to, co wpisałem (stan obecny).
- **B. Tak** — pokazuj okolicę obok nazwy, np. `Tył · znamię przy łopatce`.

Jeśli **B**, to skąd brać okolicę:

- **B1. Dynamicznie** z widoku, na którym leży znamię
  (`lesions.body_map_id → body_maps.view_name`). Prosto, bez zmian w bazie.
  Skutek: zmiana nazwy widoku zmieni też ten kontekst.
- **B2. Utrwalać** okolicę w chwili nadpisania (prefiks „zamrożony", nie zmienia
  się po zmianie nazwy widoku). Wymaga zapisu (np. doklejenie okolicy do
  `lesions.label`) bez zmiany schematu.

## Kryteria akceptacji (do uzupełnienia po decyzji)

- [ ] Decyzja zapisana w mapie i tutaj (## Answer).

## Answer

**Decyzja: B (tak) + B1 (dynamicznie).**

Po nadpisaniu nazwy znamienia pokazujemy okolicę ciała obok nazwy, np.
`Tył · znamię przy łopatce`. Okolicę bierzemy **dynamicznie** z widoku, na
którym leży znamię (`lesions.body_map_id → body_maps.view_name`), bez zmian w
schemacie. Dla auto-nazw (`Tył-3`) okolica jest już w nazwie, więc jej nie
dublujemy — kontekst pokazujemy TYLKO, gdy nazwa została nadpisana.

Wdrożone: `src/lib/bodyAreas.js` (`isAutoNamed`, `areaContextFor`),
`src/components/LesionName.jsx` — użyty w `LesionsList`, `Reminders`,
`LesionDetail`, `LesionInfoPanel`.
